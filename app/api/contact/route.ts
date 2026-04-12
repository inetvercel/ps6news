import {NextRequest, NextResponse} from 'next/server'
import {Resend} from 'resend'

const resend = new Resend(process.env.RESEND)

export async function POST(request: NextRequest) {
  try {
    const {name, email, message, reason} = await request.json()

    if (!name || !email || !message) {
      return NextResponse.json({error: 'Missing required fields'}, {status: 400})
    }

    await resend.emails.send({
      from: 'PS6News.com <onboarding@resend.dev>',
      to: 'hello@gamerbolt.com',
      subject: 'NEW MESSAGE ON PS6NEWS.COM',
      replyTo: email,
      html: `
        <div style="font-family:sans-serif;max-width:600px;margin:0 auto;background:#0B0F1A;color:#D1D5DB;padding:32px;border-radius:12px;">
          <h2 style="color:#3BA3FF;margin-top:0;">New Contact Form Submission</h2>
          <table style="width:100%;border-collapse:collapse;">
            <tr>
              <td style="padding:8px 0;color:#6B7280;width:100px;">Type:</td>
              <td style="padding:8px 0;color:#fff;font-weight:bold;text-transform:capitalize;">${reason || 'General'}</td>
            </tr>
            <tr>
              <td style="padding:8px 0;color:#6B7280;">Name:</td>
              <td style="padding:8px 0;color:#fff;">${name}</td>
            </tr>
            <tr>
              <td style="padding:8px 0;color:#6B7280;">Email:</td>
              <td style="padding:8px 0;color:#fff;"><a href="mailto:${email}" style="color:#3BA3FF;">${email}</a></td>
            </tr>
          </table>
          <div style="margin-top:24px;padding:20px;background:#111827;border-radius:8px;border-left:3px solid #3BA3FF;">
            <p style="margin:0;color:#9CA3AF;font-size:13px;margin-bottom:8px;">Message:</p>
            <p style="margin:0;color:#fff;white-space:pre-wrap;">${message}</p>
          </div>
          <p style="margin-top:24px;font-size:12px;color:#4B5563;">Sent from ps6news.com/contact</p>
        </div>
      `,
    })

    return NextResponse.json({success: true})
  } catch (error: any) {
    console.error('Contact form error:', error)
    return NextResponse.json({error: error.message || 'Failed to send'}, {status: 500})
  }
}
