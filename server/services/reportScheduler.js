/**
 * Automated Daily Report Scheduler for Srinu & Management
 * Sends daily email summary of Arshith Boot Camp student registrations, follow-ups & revenue.
 */
const Lead = require('../models/Lead');
const Task = require('../models/Task');
const brevoService = require('./brevoService');

async function generateAndSendDailyReport() {
  try {
    const recipient = process.env.SRINU_REPORT_EMAIL || 'srinu@arshithgroup.com';
    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);

    const bootcampFilter = { leadSource: 'Arshith Boot Camp' };

    const totalStudents = await Lead.countDocuments(bootcampFilter);
    const todayRegistrations = await Lead.countDocuments({
      ...bootcampFilter,
      createdAt: { $gte: startOfToday }
    });

    const courseStats = await Lead.aggregate([
      { $match: bootcampFilter },
      { $group: { _id: '$courseName', count: { $sum: 1 } } },
      { $sort: { count: -1 } }
    ]);

    const statusStats = await Lead.aggregate([
      { $match: bootcampFilter },
      { $group: { _id: '$leadStatus', count: { $sum: 1 } } }
    ]);

    const leadIds = (await Lead.find(bootcampFilter).select('_id')).map(l => l._id);

    const pendingFollowUps = await Task.countDocuments({
      relatedLead: { $in: leadIds },
      status: { $in: ['Pending', 'In Progress'] }
    });

    const completedToday = await Task.countDocuments({
      relatedLead: { $in: leadIds },
      status: 'Completed',
      updatedAt: { $gte: startOfToday }
    });

    const overdueFollowUps = await Task.countDocuments({
      relatedLead: { $in: leadIds },
      status: { $in: ['Pending', 'In Progress'] },
      dueDate: { $lt: new Date() }
    });

    const reportDate = new Date().toLocaleDateString('en-IN', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });

    const subject = `[Daily Report] Arshith Boot Camp Performance - ${reportDate}`;

    const coursesHtml = courseStats.length > 0
      ? courseStats.map(c => `<tr><td style="padding:8px 12px;border-bottom:1px solid #EEE">${c._id || 'Unassigned'}</td><td style="padding:8px 12px;border-bottom:1px solid #EEE;font-weight:600;text-align:right">${c.count}</td></tr>`).join('')
      : '<tr><td colspan="2" style="padding:8px 12px;text-align:center;color:#888">No registrations recorded yet</td></tr>';

    const html = `
      <div style="font-family:'Segoe UI',Roboto,Helvetica,Arial,sans-serif;max-width:640px;margin:0 auto;background:#FBF8F1;border:1px solid #E4E0D7;border-radius:12px;overflow:hidden">
        <div style="background:#013A2B;padding:26px 30px;color:#FBF8F1">
          <p style="margin:0 0 4px;font-size:12px;letter-spacing:1.5px;color:#7CC283;text-transform:uppercase">Executive Performance Brief</p>
          <h1 style="margin:0;font-size:22px">Arshith Boot Camp Daily Summary</h1>
          <p style="margin:6px 0 0;font-size:13px;color:#C9D6CE">${reportDate}</p>
        </div>

        <div style="padding:28px 30px;color:#302B25;line-height:1.6">
          <p style="font-size:15px;margin:0 0 20px">Hi <strong>Srinu</strong>,</p>
          <p style="margin:0 0 20px">Here is your automated daily status report for student registrations, admissions pipeline, and team follow-ups across Arshith Boot Camp.</p>

          <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:24px">
            <tr>
              <td width="48%" style="background:#FFFFFF;border:1px solid #E2DED5;border-radius:10px;padding:16px 20px">
                <span style="font-size:12px;color:#6B655B;text-transform:uppercase">Total Registered Students</span>
                <div style="font-size:28px;font-weight:700;color:#013A2B;margin-top:4px">${totalStudents}</div>
              </td>
              <td width="4%"></td>
              <td width="48%" style="background:#FFFFFF;border:1px solid #E2DED5;border-radius:10px;padding:16px 20px">
                <span style="font-size:12px;color:#6B655B;text-transform:uppercase">Today's New Registrations</span>
                <div style="font-size:28px;font-weight:700;color:#2E7D32;margin-top:4px">+${todayRegistrations}</div>
              </td>
            </tr>
          </table>

          <div style="background:#FFFFFF;border:1px solid #E2DED5;border-radius:10px;padding:20px;margin-bottom:24px">
            <h3 style="margin:0 0 14px;color:#013A2B;font-size:16px">Course-wise Enrollments</h3>
            <table width="100%" style="border-collapse:collapse;font-size:14px">
              <thead>
                <tr style="background:#F8F5EE;color:#426557">
                  <th style="padding:8px 12px;text-align:left">Course Track</th>
                  <th style="padding:8px 12px;text-align:right">Enrolled Students</th>
                </tr>
              </thead>
              <tbody>
                ${coursesHtml}
              </tbody>
            </table>
          </div>

          <div style="background:#FFFFFF;border:1px solid #E2DED5;border-radius:10px;padding:20px;margin-bottom:24px">
            <h3 style="margin:0 0 14px;color:#013A2B;font-size:16px">Admissions & Follow-ups Queue</h3>
            <table width="100%" style="font-size:14px;line-height:2">
              <tr>
                <td>Pending Counselor Follow-ups:</td>
                <td style="font-weight:700;color:#E65100;text-align:right">${pendingFollowUps}</td>
              </tr>
              <tr>
                <td>Completed Follow-ups Today:</td>
                <td style="font-weight:700;color:#2E7D32;text-align:right">${completedToday}</td>
              </tr>
              <tr>
                <td>Overdue Follow-ups:</td>
                <td style="font-weight:700;color:#C62828;text-align:right">${overdueFollowUps}</td>
              </tr>
            </table>
          </div>

          <p style="font-size:13px;color:#7A746A;margin:24px 0 0">Generated automatically by CRM Pro Â· Arshith Group</p>
        </div>
      </div>
    `;

    const result = await brevoService.sendRequest('/transactional/send', {
      to: recipient,
      toName: 'Srinu',
      subject,
      html,
      tags: ['daily-report', 'bootcamp-management', 'srinu']
    });

    console.log(`[DailyReport] Automated report dispatched to ${recipient}:`, result.success ? 'Delivered' : result.error);
    return { success: true, delivered: result.success, recipient, totalStudents, todayRegistrations };
  } catch (err) {
    console.error('[DailyReport] Generation error:', err);
    return { success: false, error: err.message };
  }
}

// Initializer: Schedule at 08:00 AM daily
function initDailyReportScheduler() {
  console.log('[DailyReport] Initialized daily reporting schedule for Srinu');
  // Check every 30 minutes if it's the target report hour (default 08:00)
  setInterval(() => {
    const now = new Date();
    const targetHour = parseInt(process.env.SRINU_REPORT_TIME ? process.env.SRINU_REPORT_TIME.split(':')[0] : '8', 10);
    const targetMinute = parseInt(process.env.SRINU_REPORT_TIME ? process.env.SRINU_REPORT_TIME.split(':')[1] : '0', 10);

    if (now.getHours() === targetHour && Math.abs(now.getMinutes() - targetMinute) <= 15) {
      generateAndSendDailyReport();
    }
  }, 30 * 60 * 1000);
}

module.exports = {
  generateAndSendDailyReport,
  initDailyReportScheduler
};

