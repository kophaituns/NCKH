// src/utils/email.service.js
// Email service for sending notifications and invitations
const logger = require('./logger');

class EmailService {
  /**
   * Send workspace invitation email
   */
  async sendWorkspaceInvitation(inviteeEmail, inviterName, workspaceName, invitationToken, frontendUrl) {
    try {
      // TODO: Integrate with nodemailer or SendGrid
      // For now, log the invitation details
      const acceptUrl = `${frontendUrl}/workspace/invitations/${invitationToken}`;
      
      logger.info(`[EmailService] Workspace invitation email would be sent:
        TO: ${inviteeEmail}
        Subject: You've been invited to join "${workspaceName}"
        Inviter: ${inviterName}
        Action URL: ${acceptUrl}
      `);

      // In production, replace with actual email sending:
      // await transporter.sendMail({
      //   to: inviteeEmail,
      //   subject: `You've been invited to join "${workspaceName}"`,
      //   html: this._buildWorkspaceInvitationTemplate(inviterName, workspaceName, acceptUrl)
      // });

      return {
        ok: true,
        message: 'Invitation email queued (mock)'
      };
    } catch (error) {
      logger.error('[EmailService] Error sending workspace invitation:', error.message);
      throw error;
    }
  }

  /**
   * Send survey collector invitation email
   */
  async sendCollectorInvitation(inviteeEmail, surveyTitle, collectorLink) {
    try {
      logger.info(`[EmailService] Collector invitation email would be sent:
        TO: ${inviteeEmail}
        Subject: You're invited to respond to "${surveyTitle}"
        Survey Link: ${collectorLink}
      `);

      return {
        ok: true,
        message: 'Collector invitation email queued (mock)'
      };
    } catch (error) {
      logger.error('[EmailService] Error sending collector invitation:', error.message);
      throw error;
    }
  }

  /**
   * Send survey share notification
   */
  async sendSurveyShare(recipientEmail, senderName, surveyTitle, surveyLink) {
    try {
      logger.info(`[EmailService] Survey share email would be sent:
        TO: ${recipientEmail}
        From: ${senderName}
        Subject: "${senderName}" shared "${surveyTitle}" with you
        Link: ${surveyLink}
      `);

      return {
        ok: true,
        message: 'Share notification email queued (mock)'
      };
    } catch (error) {
      logger.error('[EmailService] Error sending survey share notification:', error.message);
      throw error;
    }
  }

  /**
   * HTML template for workspace invitation
   */
  _buildWorkspaceInvitationTemplate(inviterName, workspaceName, acceptUrl) {
    return `
      <html>
        <body style="font-family: Arial, sans-serif;">
          <h2>You've been invited to a workspace!</h2>
          <p><strong>${inviterName}</strong> has invited you to join the workspace <strong>"${workspaceName}"</strong>.</p>
          <p>
            <a href="${acceptUrl}" style="background-color: #007bff; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; display: inline-block;">
              Accept Invitation
            </a>
          </p>
          <p>Or copy this link: ${acceptUrl}</p>
        </body>
      </html>
    `;
  }
}

module.exports = new EmailService();
