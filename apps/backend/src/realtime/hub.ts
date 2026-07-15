import { Server as HttpServer } from 'http';
import { Server, Socket } from 'socket.io';
import {
  DriverLocationPayload,
  RideOfferPayload,
  SocketEvents,
  UserRole,
  Ride,
} from '@adm/shared';
import { env } from '../env';
import { verifyAccessToken } from '../lib/jwt';
import { prisma } from '../prisma';

/**
 * RealtimeHub — Socket.IO ustidagi markaziy qatlam.
 * Buyurtma yangilanishlari, haydovchi joylashuvi va park holatini
 * kerakli foydalanuvchilarga yetkazadi.
 */
class RealtimeHub {
  private io: Server | null = null;
  /** userId → socket id'lar to'plami (bir foydalanuvchi bir nechta qurilma) */
  private userSockets = new Map<string, Set<string>>();

  init(server: HttpServer): Server {
    const io = new Server(server, {
      cors: { origin: env.corsOrigins, credentials: true },
    });

    // JWT autentifikatsiya
    io.use((socket, next) => {
      const token = socket.handshake.auth?.token as string | undefined;
      if (!token) return next(new Error('unauthorized'));
      try {
        const payload = verifyAccessToken(token);
        socket.data.userId = payload.sub;
        socket.data.role = payload.role;
        next();
      } catch {
        next(new Error('unauthorized'));
      }
    });

    io.on('connection', (socket) => this.onConnection(socket));
    this.io = io;
    return io;
  }

  private onConnection(socket: Socket) {
    const userId: string = socket.data.userId;
    const role: UserRole = socket.data.role;

    this.addUserSocket(userId, socket.id);
    // Admin va operatorlar butun park hodisalarini oladi
    if (role === UserRole.ADMIN || role === UserRole.OPERATOR) {
      socket.join('fleet');
    }

    socket.on(SocketEvents.DRIVER_LOCATION, (p: DriverLocationPayload) =>
      this.handleDriverLocation(userId, p).catch(() => {}),
    );

    socket.on(SocketEvents.RIDE_SUBSCRIBE, (rideId: string) => {
      if (typeof rideId === 'string') socket.join(`ride:${rideId}`);
    });

    socket.on('disconnect', () => this.removeUserSocket(userId, socket.id));
  }

  private async handleDriverLocation(userId: string, p: DriverLocationPayload) {
    const driver = await prisma.driverProfile.update({
      where: { userId },
      data: {
        lat: p.location.lat,
        lng: p.location.lng,
        headingDeg: p.headingDeg ?? undefined,
        lastSeenAt: new Date(),
      },
      include: { user: true },
    });

    // Faol safar bo'lsa — yo'lovchiga haydovchi joylashuvini yuborish
    if (p.rideId) {
      this.io?.to(`ride:${p.rideId}`).emit(SocketEvents.DRIVER_LOCATION_UPDATE, {
        rideId: p.rideId,
        location: p.location,
        headingDeg: p.headingDeg ?? null,
      });
    }

    // Admin/operator paneliga park yangilanishi
    this.io?.to('fleet').emit(SocketEvents.FLEET_UPDATE, {
      driverId: driver.id,
      name: driver.user.name,
      location: p.location,
      headingDeg: p.headingDeg ?? null,
      status: driver.status,
      activeRideId: p.rideId ?? null,
    });
  }

  private addUserSocket(userId: string, socketId: string) {
    if (!this.userSockets.has(userId)) this.userSockets.set(userId, new Set());
    this.userSockets.get(userId)!.add(socketId);
  }

  private removeUserSocket(userId: string, socketId: string) {
    const set = this.userSockets.get(userId);
    set?.delete(socketId);
    if (set && set.size === 0) this.userSockets.delete(userId);
  }

  // ── Tashqi API (ride servis chaqiradi) ──────────────────

  /** Buyurtma yangilanishini yo'lovchi, haydovchi va operatorlarga yuborish */
  emitRideUpdate(ride: Ride) {
    this.io?.to(`ride:${ride.id}`).emit(SocketEvents.RIDE_UPDATED, ride);
    if (ride.passenger) this.emitToUser(ride.passenger.id, SocketEvents.RIDE_UPDATED, ride);
    if (ride.driver) this.emitToUser(ride.driver.user.id, SocketEvents.RIDE_UPDATED, ride);
    this.io?.to('fleet').emit(SocketEvents.RIDE_UPDATED, ride);
  }

  /** Haydovchiga yangi buyurtma taklifi */
  emitRideOffer(driverUserId: string, payload: RideOfferPayload) {
    this.emitToUser(driverUserId, SocketEvents.RIDE_OFFER, payload);
  }

  emitToUser(userId: string, event: string, data: unknown) {
    const set = this.userSockets.get(userId);
    if (!set) return;
    for (const socketId of set) this.io?.to(socketId).emit(event, data);
  }

  isUserOnline(userId: string): boolean {
    return this.userSockets.has(userId);
  }
}

export const hub = new RealtimeHub();
