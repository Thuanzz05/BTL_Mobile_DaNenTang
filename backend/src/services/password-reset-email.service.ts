const escapeHtml = (value: string) =>
  value.replace(/[&<>"]/g, (character) => {
    const entities: Record<string, string> = {
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
    };
    return entities[character];
  });

export class PasswordResetEmailService {
  static async send(email: string, name: string, code: string) {
    const apiKey = process.env.RESEND_API_KEY;
    const from = process.env.PASSWORD_RESET_FROM;
    if (!apiKey || !from) {
      return false;
    }

    try {
      const response = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          from,
          to: [email],
          subject: 'Mã đặt lại mật khẩu Wordleaf',
          html: `<p>Xin chào ${escapeHtml(name)},</p>
            <p>Mã đặt lại mật khẩu của bạn là:</p>
            <p style="font-size:28px;font-weight:700;letter-spacing:8px">${code}</p>
            <p>Mã có hiệu lực trong 10 phút. Nếu bạn không yêu cầu, hãy bỏ qua email này.</p>`,
        }),
        signal: AbortSignal.timeout(10000),
      });
      if (!response.ok) {
        console.error('Không gửi được email đặt lại mật khẩu:', response.status);
        return false;
      }
      return true;
    } catch {
      console.error('Không kết nối được dịch vụ gửi email đặt lại mật khẩu');
      return false;
    }
  }
}
