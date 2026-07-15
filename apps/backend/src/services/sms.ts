import { env } from '../env';

/**
 * SMS yuborish abstraksiyasi.
 * SMS_PROVIDER env orqali tanlanadi: console | eskiz | playmobile.
 * Har bir provayder bitta send(phone, text) interfeysini bajaradi.
 */

export interface SmsProvider {
  send(phone: string, text: string): Promise<void>;
}

/** +998901234567 → 998901234567 */
function normalize(phone: string): string {
  return phone.replace(/[^\d]/g, '');
}

// ── Console (dev) ──────────────────────────────────────────
class ConsoleProvider implements SmsProvider {
  async send(phone: string, text: string): Promise<void> {
    // eslint-disable-next-line no-console
    console.log(`📲 [SMS→${phone}] ${text}`);
  }
}

// ── Eskiz.uz ───────────────────────────────────────────────
class EskizProvider implements SmsProvider {
  private token: string | null = null;

  private async login(): Promise<string> {
    const res = await fetch(`${env.eskiz.baseUrl}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: env.eskiz.email, password: env.eskiz.password }),
    });
    const data: any = await res.json();
    const token = data?.data?.token;
    if (!token) throw new Error('Eskiz: token olinmadi');
    this.token = token;
    return token;
  }

  async send(phone: string, text: string): Promise<void> {
    if (!this.token) await this.login();
    const doSend = async () => {
      const form = new URLSearchParams();
      form.set('mobile_phone', normalize(phone));
      form.set('message', text);
      form.set('from', env.eskiz.from);
      return fetch(`${env.eskiz.baseUrl}/message/sms/send`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${this.token}`, 'Content-Type': 'application/x-www-form-urlencoded' },
        body: form.toString(),
      });
    };
    let res = await doSend();
    if (res.status === 401) {
      // Token muddati tugagan — qayta kirish
      await this.login();
      res = await doSend();
    }
    if (!res.ok) throw new Error(`Eskiz: SMS yuborilmadi (${res.status})`);
  }
}

// ── Play Mobile ────────────────────────────────────────────
class PlayMobileProvider implements SmsProvider {
  async send(phone: string, text: string): Promise<void> {
    const auth = Buffer.from(`${env.playmobile.login}:${env.playmobile.password}`).toString('base64');
    const body = {
      messages: [
        {
          recipient: normalize(phone),
          'message-id': `adm_${Date.now()}`,
          sms: { originator: env.playmobile.from, content: { text } },
        },
      ],
    };
    const res = await fetch(`${env.playmobile.baseUrl}/send`, {
      method: 'POST',
      headers: { Authorization: `Basic ${auth}`, 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    if (!res.ok) throw new Error(`PlayMobile: SMS yuborilmadi (${res.status})`);
  }
}

function createProvider(): SmsProvider {
  switch (env.smsProvider) {
    case 'eskiz':
      return new EskizProvider();
    case 'playmobile':
      return new PlayMobileProvider();
    default:
      return new ConsoleProvider();
  }
}

const provider = createProvider();

/** OTP kodini yuborish. Console rejimida faqat log qiladi. */
export async function sendSms(phone: string, text: string): Promise<void> {
  await provider.send(phone, text);
}

export function isConsoleProvider(): boolean {
  return env.smsProvider === 'console';
}
