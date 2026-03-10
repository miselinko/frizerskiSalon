import logging
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText
import aiosmtplib
from app.core.config import settings

logger = logging.getLogger(__name__)


def _base_html(content: str, title: str) -> str:
    return f"""<!DOCTYPE html>
<html lang="sr">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>{title}</title>
</head>
<body style="margin:0;padding:0;background:#0a0f1e;font-family:Inter,Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#0a0f1e;padding:40px 20px;">
    <tr><td align="center">
      <table width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;">
        <!-- Header -->
        <tr>
          <td style="background:#0d1220;border:1px solid #243052;border-bottom:none;border-radius:16px 16px 0 0;padding:28px 32px;">
            <table width="100%" cellpadding="0" cellspacing="0">
              <tr>
                <td>
                  <table cellpadding="0" cellspacing="0">
                    <tr>
                      <td style="background:#f97316;border-radius:10px;width:36px;height:36px;text-align:center;vertical-align:middle;">
                        <span style="color:white;font-size:18px;">✂️</span>
                      </td>
                      <td style="padding-left:12px;">
                        <span style="color:white;font-weight:700;font-size:18px;">Frizerski Salon</span>
                      </td>
                    </tr>
                  </table>
                </td>
              </tr>
            </table>
          </td>
        </tr>
        <!-- Body -->
        <tr>
          <td style="background:#141b2d;border-left:1px solid #243052;border-right:1px solid #243052;padding:32px;">
            {content}
          </td>
        </tr>
        <!-- Footer -->
        <tr>
          <td style="background:#0d1220;border:1px solid #243052;border-top:none;border-radius:0 0 16px 16px;padding:20px 32px;text-align:center;">
            <p style="color:#4a5568;font-size:12px;margin:0;">
              © Frizerski Salon • Sva prava zadržana
            </p>
          </td>
        </tr>
      </table>
    </td></tr>
  </table>
</body>
</html>"""


def _info_row(label: str, value: str) -> str:
    return f"""
    <tr>
      <td style="padding:8px 0;border-bottom:1px solid #243052;">
        <span style="color:#8a9bb5;font-size:13px;">{label}</span>
      </td>
      <td style="padding:8px 0;border-bottom:1px solid #243052;text-align:right;">
        <span style="color:#f1f5f9;font-size:13px;font-weight:500;">{value}</span>
      </td>
    </tr>"""


def build_approved_email(
    client_name: str,
    barber_name: str,
    service_name: str,
    date: str,
    start_time: str,
    admin_note: str = "",
) -> str:
    note_block = f"""
    <div style="background:#1c2540;border:1px solid #243052;border-left:3px solid #f97316;border-radius:8px;padding:14px 16px;margin-top:20px;">
      <p style="color:#8a9bb5;font-size:12px;margin:0 0 4px 0;">Napomena od salona:</p>
      <p style="color:#f1f5f9;font-size:14px;margin:0;">{admin_note}</p>
    </div>""" if admin_note else ""

    content = f"""
    <div style="text-align:center;margin-bottom:28px;">
      <div style="width:60px;height:60px;background:rgba(34,197,94,0.12);border:1px solid rgba(34,197,94,0.3);border-radius:50%;display:inline-flex;align-items:center;justify-content:center;font-size:28px;margin-bottom:16px;">✅</div>
      <h1 style="color:white;font-size:22px;font-weight:700;margin:0 0 8px 0;">Termin potvrđen!</h1>
      <p style="color:#8a9bb5;font-size:15px;margin:0;">Tvoj termin je uspešno potvrđen, {client_name}.</p>
    </div>

    <div style="background:#1c2540;border:1px solid #243052;border-radius:12px;padding:20px;margin-bottom:20px;">
      <p style="color:#8a9bb5;font-size:11px;font-weight:600;text-transform:uppercase;letter-spacing:1px;margin:0 0 12px 0;">Detalji rezervacije</p>
      <table width="100%" cellpadding="0" cellspacing="0">
        {_info_row("Frizer", barber_name)}
        {_info_row("Usluga", service_name)}
        {_info_row("Datum", date)}
        {_info_row("Vreme", start_time)}
      </table>
    </div>

    {note_block}

    <p style="color:#8a9bb5;font-size:13px;line-height:1.6;margin-top:20px;">
      Ako ne možeš da dođeš, molimo te da nas obavestiš što pre kako bismo mogli da ponudimo termin nekom drugom.
    </p>

    <div style="text-align:center;margin-top:28px;">
      <a href="http://localhost:3000/zakazivanje" style="background:#f97316;color:white;text-decoration:none;padding:12px 28px;border-radius:10px;font-weight:600;font-size:14px;display:inline-block;">
        Zakaži novi termin
      </a>
    </div>"""

    return _base_html(content, "Termin potvrđen")


def build_rejected_email(
    client_name: str,
    barber_name: str,
    service_name: str,
    date: str,
    start_time: str,
    admin_note: str = "",
) -> str:
    note_block = f"""
    <div style="background:#1c2540;border:1px solid #243052;border-left:3px solid #ef4444;border-radius:8px;padding:14px 16px;margin-top:20px;">
      <p style="color:#8a9bb5;font-size:12px;margin:0 0 4px 0;">Razlog odbijanja:</p>
      <p style="color:#f1f5f9;font-size:14px;margin:0;">{admin_note}</p>
    </div>""" if admin_note else ""

    content = f"""
    <div style="text-align:center;margin-bottom:28px;">
      <div style="width:60px;height:60px;background:rgba(239,68,68,0.12);border:1px solid rgba(239,68,68,0.3);border-radius:50%;display:inline-flex;align-items:center;justify-content:center;font-size:28px;margin-bottom:16px;">❌</div>
      <h1 style="color:white;font-size:22px;font-weight:700;margin:0 0 8px 0;">Termin odbijen</h1>
      <p style="color:#8a9bb5;font-size:15px;margin:0;">Nažalost, tvoj zahtev za termin nije potvrđen, {client_name}.</p>
    </div>

    <div style="background:#1c2540;border:1px solid #243052;border-radius:12px;padding:20px;margin-bottom:20px;">
      <p style="color:#8a9bb5;font-size:11px;font-weight:600;text-transform:uppercase;letter-spacing:1px;margin:0 0 12px 0;">Traženi termin</p>
      <table width="100%" cellpadding="0" cellspacing="0">
        {_info_row("Frizer", barber_name)}
        {_info_row("Usluga", service_name)}
        {_info_row("Datum", date)}
        {_info_row("Vreme", start_time)}
      </table>
    </div>

    {note_block}

    <p style="color:#8a9bb5;font-size:13px;line-height:1.6;margin-top:20px;">
      Možeš pokušati da zakažeš drugi termin — slobodna mesta su dostupna online.
    </p>

    <div style="text-align:center;margin-top:28px;">
      <a href="http://localhost:3000/zakazivanje" style="background:#f97316;color:white;text-decoration:none;padding:12px 28px;border-radius:10px;font-weight:600;font-size:14px;display:inline-block;">
        Zakaži drugi termin
      </a>
    </div>"""

    return _base_html(content, "Termin odbijen")


async def send_email(to: str, subject: str, html: str) -> bool:
    if not settings.GMAIL_APP_PASSWORD:
        logger.warning("GMAIL_APP_PASSWORD nije postavljen, email nije poslat")
        return False

    try:
        msg = MIMEMultipart("alternative")
        msg["Subject"] = subject
        msg["From"] = f"{settings.FROM_NAME} <{settings.FROM_EMAIL}>"
        msg["To"] = to
        msg.attach(MIMEText(html, "html", "utf-8"))

        await aiosmtplib.send(
            msg,
            hostname="smtp.gmail.com",
            port=587,
            start_tls=True,
            username=settings.GMAIL_USER,
            password=settings.GMAIL_APP_PASSWORD,
        )
        logger.info(f"Email uspešno poslat na {to}")
        return True
    except Exception as e:
        logger.error(f"Email greška: {e}")
        return False
