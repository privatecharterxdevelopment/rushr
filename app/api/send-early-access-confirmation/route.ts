import { NextRequest, NextResponse } from 'next/server'
import { Resend } from 'resend'
import { createClient } from '@supabase/supabase-js'

const resend = new Resend(process.env.RESEND_API_KEY)

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { email, name, phone } = body

    if (!email || !name) {
      return NextResponse.json(
        { error: 'Email and name are required' },
        { status: 400 }
      )
    }

    // Add to Supabase waitlist table
    const { error: dbError } = await supabase
      .from('pro_early_access_waitlist')
      .insert({
        name: name.trim(),
        email: email.toLowerCase().trim(),
        phone: phone?.trim() || null,
        created_at: new Date().toISOString()
      })

    if (dbError && !dbError.message.includes('duplicate')) {
      console.error('Supabase insert error:', dbError)
      // Don't fail the request if DB insert fails, still send email
    }

    const { data, error } = await resend.emails.send({
      from: 'Rushr Pro <noreply@userushr.com>',
      to: email,
      subject: "You're on the Rushr Pro Early Access List!",
      html: `<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">
<html dir="ltr" lang="en">
  <head>
    <meta content="width=device-width" name="viewport" />
    <link
      rel="preload"
      as="image"
      href="https://resend-attachments.s3.amazonaws.com/hUV19em8PwJib8k" />
    <meta content="text/html; charset=UTF-8" http-equiv="Content-Type" />
    <meta name="x-apple-disable-message-reformatting" />
    <meta content="IE=edge" http-equiv="X-UA-Compatible" />
    <meta name="x-apple-disable-message-reformatting" />
    <meta
      content="telephone=no,address=no,email=no,date=no,url=no"
      name="format-detection" />
    <style>
      body, table, td, a { -webkit-text-size-adjust: 100%; -ms-text-size-adjust: 100%; }
      table, td { mso-table-lspace: 0pt; mso-table-rspace: 0pt; }
      img { -ms-interpolation-mode: bicubic; border: 0; height: auto; line-height: 100%; outline: none; text-decoration: none; display: block; }
      body { margin: 0; padding: 0; width: 100%; }
      @media only screen and (max-width: 599px) {
        .container { width: 100% !important; max-width: 100% !important; }
        .mobile-padding { padding-left: 24px !important; padding-right: 24px !important; }
        .mobile-text { font-size: 16px !important; line-height: 24px !important; }
        .mobile-title { font-size: 26px !important; line-height: 34px !important; }
        .mobile-button { padding: 14px 40px !important; font-size: 17px !important; }
      }
      @media (prefers-color-scheme: dark) {
        .dark-bg { background-color: #1a1a1a !important; }
        .dark-card { background-color: #2d2d2d !important; }
        .dark-text { color: #f0f0f0 !important; }
        .dark-secondary { color: #b0b0b0 !important; }
        .dark-border { border-color: #404040 !important; }
        .dark-info-box { background-color: #1f1f1f !important; border-color: #404040 !important; }
      }
      .button-link:hover { background-color: #0052cc !important; }
      @media (prefers-reduced-motion: reduce) {
        * { animation: none !important; transition: none !important; }
      }
    </style>
  </head>
  <body>
    <div
      style="display:none;overflow:hidden;line-height:1px;opacity:0;max-height:0;max-width:0"
      data-skip-in-text="true">
      Your Rushr Pro Access Is Locked In
    </div>
    <table
      width="100%"
      border="0"
      cellpadding="0"
      cellspacing="0"
      role="presentation"
      align="center">
      <tbody>
        <tr>
          <td>
            <table
              align="center"
              width="100%"
              border="0"
              cellpadding="0"
              cellspacing="0"
              role="presentation">
              <tbody>
                <tr>
                  <td>
                    <table
                      width="100%"
                      border="0"
                      cellpadding="0"
                      cellspacing="0"
                      role="presentation"
                      style="width:100%">
                      <tbody>
                        <tr>
                          <td>
                            <div
                              style="margin:0;padding:0;display:none;max-height:0;overflow:hidden;mso-hide:all;font-size:1px;line-height:1px;color:#f6f6f9">
                              <p style="margin:0;padding:0">
                                <span>You're all set! Your exclusive benefits are locked in. We'll notify you when Rushr Pro launches.</span>
                              </p>
                            </div>
                            <table
                              width="100%"
                              border="0"
                              cellpadding="0"
                              cellspacing="0"
                              role="presentation"
                              class="dark-bg"
                              style="margin:0;padding:0;background-color:#f6f6f9">
                              <tbody>
                                <tr>
                                  <td>
                                    <tr style="margin:0;padding:0">
                                      <td
                                        align="center"
                                        style="margin:0;padding:40px 16px">
                                        <table
                                          align="center"
                                          width="100%"
                                          border="0"
                                          cellpadding="0"
                                          cellspacing="0"
                                          role="presentation">
                                          <tbody style="width:100%">
                                            <tr style="width:100%">
                                              <td align="center">
                                                <img
                                                  alt="Rushr logo"
                                                  height="49"
                                                  src="https://resend-attachments.s3.amazonaws.com/hUV19em8PwJib8k"
                                                  style="display:block;outline:none;border:none;text-decoration:none;padding-bottom:8px"
                                                  width="166" />
                                              </td>
                                            </tr>
                                          </tbody>
                                        </table>
                                        <table
                                          width="600"
                                          border="0"
                                          cellpadding="0"
                                          cellspacing="0"
                                          role="presentation"
                                          class="container"
                                          style="margin:0;padding:0;max-width:600px;width:100%">
                                          <tbody>
                                            <tr>
                                              <td>
                                                <tr style="margin:0;padding:0">
                                                  <td style="margin:0;padding:0">
                                                    <table
                                                      width="100%"
                                                      border="0"
                                                      cellpadding="0"
                                                      cellspacing="0"
                                                      role="presentation"
                                                      class="dark-card"
                                                      style="margin:0;padding:0;background-color:#ffffff;border-radius:12px;box-shadow:0 4px 16px rgba(0, 0, 0, 0.08);overflow:hidden">
                                                      <tbody>
                                                        <tr>
                                                          <td>
                                                            <tr style="margin:0;padding:0">
                                                              <td style="margin:0;padding:0;background-color:#0066FF;height:4px;line-height:4px;font-size:1px">
                                                                <p style="margin:0;padding:0"><span> </span></p>
                                                              </td>
                                                            </tr>
                                                            <tr style="margin:0;padding:0">
                                                              <td class="mobile-padding" style="margin:0;padding:56px 48px 8px 48px">
                                                                <h1 class="mobile-title dark-text" style='margin:0px;padding:0;color:rgb(34, 34, 34);font-family:-apple-system, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;font-size:32px;font-weight:700;letter-spacing:-0.5px;line-height:40px'>
                                                                  <span>You're all set, ${name}! 🎉</span>
                                                                </h1>
                                                              </td>
                                                            </tr>
                                                            <tr style="margin:0;padding:0">
                                                              <td class="mobile-padding" style="margin:0;padding:24px 48px 0 48px">
                                                                <p class="mobile-text dark-secondary" style='margin:0px;padding:0;color:rgb(85, 85, 85);font-family:-apple-system, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;font-size:17px;line-height:26px'>
                                                                  <span>Thank you for registering for Rushr Pro! You're now officially on our priority list and your exclusive benefits are locked in.</span>
                                                                </p>
                                                              </td>
                                                            </tr>
                                                            <tr style="margin:0;padding:0">
                                                              <td class="mobile-padding" style="margin:0;padding:16px 48px 0 48px">
                                                                <p class="mobile-text dark-secondary" style='margin:0px;padding:0;color:rgb(85, 85, 85);font-family:-apple-system, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;font-size:17px;line-height:26px'>
                                                                  <span>We're working hard to bring Rushr Pro to life, and you'll be among the very first to know when we're ready to launch.</span>
                                                                </p>
                                                              </td>
                                                            </tr>
                                                            <tr style="margin:0;padding:0">
                                                              <td class="mobile-padding" style="margin:0;padding:32px 48px 32px 48px">
                                                                <table width="100%" border="0" cellpadding="0" cellspacing="0" role="presentation">
                                                                  <tbody>
                                                                    <tr>
                                                                      <td>
                                                                        <tr style="margin:0;padding:0">
                                                                          <td class="dark-border" style="margin:0;padding:0;border-top:1px solid #e6e6ea">
                                                                            <p style="margin:0;padding:0"><br /></p>
                                                                          </td>
                                                                        </tr>
                                                                      </td>
                                                                    </tr>
                                                                  </tbody>
                                                                </table>
                                                              </td>
                                                            </tr>
                                                            <tr style="margin:0;padding:0">
                                                              <td class="mobile-padding" style="margin:0;padding:0 48px 32px 48px">
                                                                <table width="100%" border="0" cellpadding="0" cellspacing="0" role="presentation" class="dark-info-box" style="margin:0;padding:0;background-color:#f0f7ff;border:1px solid #cce5ff;border-radius:8px">
                                                                  <tbody>
                                                                    <tr>
                                                                      <td>
                                                                        <tr style="margin:0;padding:0">
                                                                          <td style="margin:0;padding:24px">
                                                                            <p class="dark-text" style='margin:0px 0px 20px;padding:0;color:rgb(34, 34, 34);font-family:-apple-system, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;font-size:16px;font-weight:600;line-height:20px'>
                                                                              <span>🎁 Your confirmed benefits</span>
                                                                            </p>
                                                                            <table width="100%" border="0" cellpadding="0" cellspacing="0" role="presentation">
                                                                              <tbody>
                                                                                <tr>
                                                                                  <td>
                                                                                    <tr style="margin:0;padding:0">
                                                                                      <td style="margin:0;padding:0 0 14px 0">
                                                                                        <table width="100%" border="0" cellpadding="0" cellspacing="0" role="presentation">
                                                                                          <tbody>
                                                                                            <tr>
                                                                                              <td>
                                                                                                <tr style="margin:0;padding:0">
                                                                                                  <td style="margin:0;padding:0;width:28px;vertical-align:top">
                                                                                                    <p style="margin:0;padding:0"><span style="color:#ffffff">✓</span></p>
                                                                                                  </td>
                                                                                                  <td class="dark-text" style="margin:0;padding:0;font-size:15px;line-height:22px;color:#222222;font-family:-apple-system, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif">
                                                                                                    <p style="margin:0;padding:0">
                                                                                                      <span><strong>💵 3 Months Free</strong></span><br /><span style="color:#004085">Get full access to Rushr Pro for 3 months at no cost</span>
                                                                                                    </p>
                                                                                                  </td>
                                                                                                </tr>
                                                                                              </td>
                                                                                            </tr>
                                                                                          </tbody>
                                                                                        </table>
                                                                                      </td>
                                                                                    </tr>
                                                                                    <tr style="margin:0;padding:0">
                                                                                      <td style="margin:0;padding:0 0 14px 0">
                                                                                        <table width="100%" border="0" cellpadding="0" cellspacing="0" role="presentation">
                                                                                          <tbody>
                                                                                            <tr>
                                                                                              <td>
                                                                                                <tr style="margin:0;padding:0">
                                                                                                  <td style="margin:0;padding:0;width:28px;vertical-align:top">
                                                                                                    <p style="margin:0;padding:0"><span style="color:#ffffff">✓</span></p>
                                                                                                  </td>
                                                                                                  <td class="dark-text" style="margin:0;padding:0;font-size:15px;line-height:22px;color:#222222;font-family:-apple-system, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif">
                                                                                                    <p style="margin:0;padding:0">
                                                                                                      <span><strong>🚀 Priority Access</strong></span><br /><span style="color:#004085">Be the first to access the platform when we launch</span>
                                                                                                    </p>
                                                                                                  </td>
                                                                                                </tr>
                                                                                              </td>
                                                                                            </tr>
                                                                                          </tbody>
                                                                                        </table>
                                                                                      </td>
                                                                                    </tr>
                                                                                    <tr style="margin:0;padding:0">
                                                                                      <td style="margin:0;padding:0">
                                                                                        <table width="100%" border="0" cellpadding="0" cellspacing="0" role="presentation">
                                                                                          <tbody>
                                                                                            <tr>
                                                                                              <td>
                                                                                                <tr style="margin:0;padding:0">
                                                                                                  <td style="margin:0;padding:0;width:28px;vertical-align:top">
                                                                                                    <p style="margin:0;padding:0"><span style="color:#ffffff">✓</span></p>
                                                                                                  </td>
                                                                                                  <td class="dark-text" style="margin:0;padding:0;font-size:15px;line-height:22px;color:#222222;font-family:-apple-system, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif">
                                                                                                    <p style="margin:0;padding:0">
                                                                                                      <span><strong>📈 Lowered Fees</strong></span><br /><span style="color:#004085">Special reduced platform fees for life</span>
                                                                                                    </p>
                                                                                                  </td>
                                                                                                </tr>
                                                                                              </td>
                                                                                            </tr>
                                                                                          </tbody>
                                                                                        </table>
                                                                                      </td>
                                                                                    </tr>
                                                                                  </td>
                                                                                </tr>
                                                                              </tbody>
                                                                            </table>
                                                                          </td>
                                                                        </tr>
                                                                      </td>
                                                                    </tr>
                                                                  </tbody>
                                                                </table>
                                                              </td>
                                                            </tr>
                                                            <tr style="margin:0;padding:0">
                                                              <td class="mobile-padding" style="margin:0;padding:0 48px 32px 48px">
                                                                <table width="100%" border="0" cellpadding="0" cellspacing="0" role="presentation">
                                                                  <tbody>
                                                                    <tr>
                                                                      <td>
                                                                        <tr style="margin:0;padding:0">
                                                                          <td class="dark-border" style="margin:0;padding:0;border-top:1px solid #e6e6ea">
                                                                            <p style="margin:0;padding:0"><br /></p>
                                                                          </td>
                                                                        </tr>
                                                                      </td>
                                                                    </tr>
                                                                  </tbody>
                                                                </table>
                                                              </td>
                                                            </tr>
                                                            <tr style="margin:0;padding:0">
                                                              <td class="mobile-padding" style="margin:0;padding:0 48px 32px 48px">
                                                                <p class="mobile-text dark-text" style='margin:0px 0px 16px;padding:0;color:rgb(34, 34, 34);font-family:-apple-system, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;font-size:17px;font-weight:600;line-height:26px'>
                                                                  <span>What happens next?</span>
                                                                </p>
                                                                <table width="100%" border="0" cellpadding="0" cellspacing="0" role="presentation" class="dark-info-box" style="margin:0;padding:0;background-color:#f8f9fa;border:1px solid #e6e6ea;border-radius:8px">
                                                                  <tbody>
                                                                    <tr>
                                                                      <td>
                                                                        <tr style="margin:0;padding:0">
                                                                          <td style="margin:0;padding:24px">
                                                                            <table width="100%" border="0" cellpadding="0" cellspacing="0" role="presentation">
                                                                              <tbody>
                                                                                <tr>
                                                                                  <td>
                                                                                    <tr style="margin:0;padding:0">
                                                                                      <td style="margin:0;padding:0 0 14px 0">
                                                                                        <table width="100%" border="0" cellpadding="0" cellspacing="0" role="presentation">
                                                                                          <tbody>
                                                                                            <tr>
                                                                                              <td>
                                                                                                <tr style="margin:0;padding:0">
                                                                                                  <td style="margin:0;padding:0;width:28px;vertical-align:top">
                                                                                                    <p style="margin:0;padding:0"><span style="color:#ffffff">1</span></p>
                                                                                                  </td>
                                                                                                  <td class="dark-text" style="margin:0;padding:0;font-size:15px;line-height:22px;color:#222222;font-family:-apple-system, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif">
                                                                                                    <p style="margin:0;padding:0">
                                                                                                      <span><strong>📧 Stay tuned for updates</strong></span><br /><span style="color:#555555">We'll keep you posted on our progress and launch date</span>
                                                                                                    </p>
                                                                                                  </td>
                                                                                                </tr>
                                                                                              </td>
                                                                                            </tr>
                                                                                          </tbody>
                                                                                        </table>
                                                                                      </td>
                                                                                    </tr>
                                                                                    <tr style="margin:0;padding:0">
                                                                                      <td style="margin:0;padding:0 0 14px 0">
                                                                                        <table width="100%" border="0" cellpadding="0" cellspacing="0" role="presentation">
                                                                                          <tbody>
                                                                                            <tr>
                                                                                              <td>
                                                                                                <tr style="margin:0;padding:0">
                                                                                                  <td style="margin:0;padding:0;width:28px;vertical-align:top">
                                                                                                    <p style="margin:0;padding:0"><span style="color:#ffffff">2</span></p>
                                                                                                  </td>
                                                                                                  <td class="dark-text" style="margin:0;padding:0;font-size:15px;line-height:22px;color:#222222;font-family:-apple-system, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif">
                                                                                                    <p style="margin:0;padding:0">
                                                                                                      <span><strong>🚀 Get early access</strong></span><br /><span style="color:#555555">You'll receive your invite before anyone else</span>
                                                                                                    </p>
                                                                                                  </td>
                                                                                                </tr>
                                                                                              </td>
                                                                                            </tr>
                                                                                          </tbody>
                                                                                        </table>
                                                                                      </td>
                                                                                    </tr>
                                                                                    <tr style="margin:0;padding:0">
                                                                                      <td style="margin:0;padding:0">
                                                                                        <table width="100%" border="0" cellpadding="0" cellspacing="0" role="presentation">
                                                                                          <tbody>
                                                                                            <tr>
                                                                                              <td>
                                                                                                <tr style="margin:0;padding:0">
                                                                                                  <td style="margin:0;padding:0;width:28px;vertical-align:top">
                                                                                                    <p style="margin:0;padding:0"><span style="color:#ffffff">3</span></p>
                                                                                                  </td>
                                                                                                  <td class="dark-text" style="margin:0;padding:0;font-size:15px;line-height:22px;color:#222222;font-family:-apple-system, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif">
                                                                                                    <p style="margin:0;padding:0">
                                                                                                      <span><strong>💪 Start growing your business</strong></span><br /><span style="color:#555555">Connect with homeowners and take your business to the next level</span>
                                                                                                    </p>
                                                                                                  </td>
                                                                                                </tr>
                                                                                              </td>
                                                                                            </tr>
                                                                                          </tbody>
                                                                                        </table>
                                                                                      </td>
                                                                                    </tr>
                                                                                  </td>
                                                                                </tr>
                                                                              </tbody>
                                                                            </table>
                                                                          </td>
                                                                        </tr>
                                                                      </td>
                                                                    </tr>
                                                                  </tbody>
                                                                </table>
                                                              </td>
                                                            </tr>
                                                            <tr style="margin:0;padding:0">
                                                              <td class="mobile-padding" style="margin:0;padding:0 48px 32px 48px">
                                                                <p class="mobile-text dark-secondary" style='margin:0px;padding:0;color:rgb(85, 85, 85);font-family:-apple-system, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;font-size:16px;line-height:24px'>
                                                                  <span>In the meantime, if you have any questions or want to learn more about what we're building, feel free to reach out to us at </span>
                                                                  <a href="mailto:hello@userushr.com" style="color:rgb(0, 102, 255);text-decoration:underline;font-weight:500" target="_blank"><u>hello@userushr.com</u></a>
                                                                  <span> or simply reply to this email.</span>
                                                                </p>
                                                              </td>
                                                            </tr>
                                                            <tr style="margin:0;padding:0">
                                                              <td class="mobile-padding" style="margin:0;padding:0 48px 56px 48px">
                                                                <p class="mobile-text dark-text" style='margin:0px;padding:0;color:rgb(34, 34, 34);font-family:-apple-system, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;font-size:17px;line-height:26px;text-align:center'>
                                                                  <span>Welcome to the Rushr Pro family! 💪</span>
                                                                </p>
                                                              </td>
                                                            </tr>
                                                          </td>
                                                        </tr>
                                                      </tbody>
                                                    </table>
                                                  </td>
                                                </tr>
                                                <tr style="margin:0;padding:0">
                                                  <td align="center" style="margin:0;padding:32px 16px 40px 16px">
                                                    <p class="dark-secondary" style='margin:0px 0px 8px;padding:0;color:rgb(136, 136, 136);font-family:-apple-system, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;font-size:14px;line-height:20px;text-align:center'>
                                                      <span>Questions? Contact </span>
                                                      <a href="mailto:hello@userushr.com" style="color:rgb(0, 102, 255);text-decoration:none;font-weight:500" target="_blank">hello@userushr.com</a>
                                                    </p>
                                                    <p class="dark-secondary" style='margin:0px;padding:0;color:rgb(136, 136, 136);font-family:-apple-system, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;font-size:12px;line-height:18px;text-align:center'>
                                                      <span>© ${new Date().getFullYear()} Rushr. All rights reserved.</span>
                                                    </p>
                                                  </td>
                                                </tr>
                                              </td>
                                            </tr>
                                          </tbody>
                                        </table>
                                      </td>
                                    </tr>
                                  </td>
                                </tr>
                              </tbody>
                            </table>
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </td>
                </tr>
              </tbody>
            </table>
          </td>
        </tr>
      </tbody>
    </table>
  </body>
</html>`,
    })

    if (error) {
      console.error('Resend error:', error)
      return NextResponse.json(
        { error: error.message || 'Failed to send email' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      message: 'Early access confirmation email sent successfully!',
      id: data?.id
    })
  } catch (error: any) {
    console.error('Early access email error:', error)
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}
