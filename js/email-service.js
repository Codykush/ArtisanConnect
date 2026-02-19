// email-service.js - Simple email service for frontend
class EmailService {
    constructor() {
        this.smtpConfig = {
            service: 'gmail',
            auth: {
                user: 'your-email@gmail.com', // Create a dedicated Gmail
                pass: 'your-app-password'      // Gmail App Password
            }
        };
    }

    // Send welcome email
    async sendWelcomeEmail(userData) {
        try {
            const response = await fetch('https://api.emailjs.com/api/v1.0/email/send', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    service_id: 'service_xxx', // Your EmailJS service ID
                    template_id: 'template_xxx', // Your template ID
                    user_id: 'user_xxx', // Your EmailJS user ID
                    template_params: {
                        to_name: userData.name,
                        to_email: userData.email,
                        message: `Welcome to ArtisanConnect! Your ${userData.role} account has been created successfully.`,
                        login_url: 'https://artisanconnect.com/login'
                    }
                })
            });

            if (response.ok) {
                console.log('Welcome email sent successfully');
                return true;
            } else {
                console.warn('Failed to send email');
                return false;
            }
        } catch (error) {
            console.error('Email sending error:', error);
            return false;
        }
    }

    // Send verification email
    async sendVerificationEmail(userData) {
        const emailContent = `
            <html>
            <head>
                <style>
                    body { font-family: Arial, sans-serif; }
                    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
                    .header { background: #3B82F6; color: white; padding: 20px; text-align: center; }
                    .content { padding: 30px; background: #f8fafc; }
                    .button { background: #3B82F6; color: white; padding: 12px 24px; 
                            text-decoration: none; border-radius: 5px; display: inline-block; }
                </style>
            </head>
            <body>
                <div class="container">
                    <div class="header">
                        <h1>🎨 Welcome to ArtisanConnect!</h1>
                    </div>
                    <div class="content">
                        <h2>Hi ${userData.name},</h2>
                        <p>Your artisan account has been created successfully!</p>
                        
                        <div style="background: white; padding: 15px; border-radius: 5px; margin: 20px 0;">
                            <p><strong>Account Details:</strong></p>
                            <p>Email: ${userData.email}</p>
                            <p>Role: ${userData.role}</p>
                            <p>Craft: ${userData.craft}</p>
                        </div>
                        
                        <p>Next steps:</p>
                        <ol>
                            <li>Complete your profile</li>
                            <li>Upload your portfolio</li>
                            <li>Start receiving orders</li>
                        </ol>
                        
                        <a href="https://artisanconnect.com/login" class="button">
                            Login to Your Account
                        </a>
                        
                        <p style="margin-top: 30px; color: #64748b;">
                            Need help? Contact us at support@artisanconnect.com
                        </p>
                    </div>
                </div>
            </body>
            </html>
        `;

        // You would send this via your backend or email service
        console.log('Email prepared:', emailContent);
        return true;
    }
}

export default new EmailService();