function doGet(request){
  return handleRequest(request);
}

function doPost(request){
  return handleRequest(request);
}

//  Enter sheet name where data is to be written below
var SHEET_NAME = "Wedding RSVP Responses";

// REPLACE THIS WITH YOUR OWN SHEET ID
var SHEET_ID = "11Sp1j-FPY18T-WCTdqSCvMhP9ANqaCX12QXSsFlUhh8"; 
var SCRIPT_PROP = PropertiesService.getScriptProperties(); // new property service

function handleRequest(request) {
  // shortly after my original solution Google announced the LockService[1]
  // this prevents concurrent access overwritting data
  // [1] http://googleappsdeveloper.blogspot.co.uk/2011/10/concurrency-and-google-apps-script.html
  // we want a public lock, one that locks for all invocations
  var lock = LockService.getPublicLock();
  lock.waitLock(30000);  // wait 30 seconds before conceding defeat.

  try {
    // next set where we write the data - you could write to multiple/alternate destinations
    var doc = SpreadsheetApp.openById(SHEET_ID);
    var sheet = doc.getSheetByName(SHEET_NAME);

    // we'll assume header is in row 1 but you can override with header_row in GET/POST data
    var headRow = request.parameter.header_row || 1;
    var headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
    var nextRow = sheet.getLastRow() + 1; // get next row
    var row = [];
    
    // loop through the header columns
    for (i in headers){
      if (headers[i] == "Timestamp"){ // special case if you include a 'Timestamp' column
        row.push(new Date());
      } else if(headers[i] == "sn") {
        row.push(sheet.getLastRow());
      } else { // else use header name to get data
        row.push(request.parameter[headers[i]] || ''); // Add fallback for missing parameters
      }
    }
    
    // more efficient to set values as [][] array than individually
    sheet.getRange(nextRow, 1, 1, row.length).setValues([row]);

    // Format the new row for better readability
    var range = sheet.getRange(nextRow, 1, 1, row.length);
    range.setBorder(true, true, true, true, true, true);
    
    // Auto-resize columns to fit content
    sheet.autoResizeColumns(1, sheet.getLastColumn());

    // send email notification
    sendEmail(request.parameter);

    // Log successful submission
    console.log('Successfully processed RSVP submission for: ' + request.parameter.name);

    // return json success results
    return ContentService
          .createTextOutput(JSON.stringify({"result":"success", "message": "RSVP submitted successfully"}))
          .setMimeType(ContentService.MimeType.JSON);
          
  } catch(e){
    // Log error for debugging
    console.error('Error processing RSVP submission:', e.toString());
    
    // if error return this
    return ContentService
          .createTextOutput(JSON.stringify({"result":"error", "error": e.toString()}))
          .setMimeType(ContentService.MimeType.JSON);
  } finally { //release lock
    lock.releaseLock();
  }
}

function setup() {
    var doc = SpreadsheetApp.getActiveSpreadsheet();
    SCRIPT_PROP.setProperty("key", doc.getId());
    
    // Create headers if they don't exist
    var sheet = doc.getSheetByName(SHEET_NAME);
    if (sheet.getLastRow() === 0 || sheet.getRange(1, 1).getValue() === '') {
      createHeaders(sheet);
    }
}

function createHeaders(sheet) {
  var headers = [
    'Timestamp',
    'name',
    'email', 
    'attendance',
    'guests',
    'dietary',
    'song',
    'message'
  ];
  
  sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
  
  // Format header row
  var headerRange = sheet.getRange(1, 1, 1, headers.length);
  headerRange.setBackground('#8B4513');
  headerRange.setFontColor('white');
  headerRange.setFontWeight('bold');
  headerRange.setBorder(true, true, true, true, true, true);
  
  // Freeze header row
  sheet.setFrozenRows(1);
}

function sendEmail(data) {
  try {
    // Email configuration - UPDATE THESE VALUES
    var recipientEmail = 'sarah.john.wedding@gmail.com'; // Change to your email
    var ccEmail = ''; // Optional CC email
    var subject = '💕 New Wedding RSVP Response';
    
    // Create email body
    var body = createEmailBody(data);
    
    // Email options
    var options = {
      'name': 'Wedding RSVP System',
      'htmlBody': body
    };
    
    // Add CC if specified
    if (ccEmail) {
      options.cc = ccEmail;
    }
    
    // Send email
    GmailApp.sendEmail(recipientEmail, subject, '', options);
    
    console.log('Email notification sent successfully');
    
  } catch(e) {
    console.error('Error sending email notification:', e.toString());
    // Don't throw error here - we don't want email issues to break form submission
  }
}

function createEmailBody(data) {
  var attendanceStatus = data.attendance === 'yes' ? '✅ Will Attend' : '❌ Cannot Attend';
  var attendanceColor = data.attendance === 'yes' ? '#28a745' : '#dc3545';
  
  var html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <div style="background: linear-gradient(135deg, #8B4513, #A0522D); padding: 30px; text-align: center; color: white;">
        <h1 style="margin: 0; font-size: 28px; font-family: 'Dancing Script', cursive;">💕 Wedding RSVP</h1>
        <p style="margin: 10px 0 0 0; font-size: 16px;">New response received</p>
      </div>
      
      <div style="background: #f8f9fa; padding: 30px;">
        <div style="background: white; padding: 25px; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
          
          <div style="text-align: center; margin-bottom: 25px;">
            <span style="background: ${attendanceColor}; color: white; padding: 8px 20px; border-radius: 25px; font-weight: bold; font-size: 14px;">
              ${attendanceStatus}
            </span>
          </div>
          
          <table style="width: 100%; border-collapse: collapse;">
            <tr>
              <td style="padding: 12px 0; border-bottom: 1px solid #eee; font-weight: bold; color: #333; width: 30%;">
                👤 Name(s)
              </td>
              <td style="padding: 12px 0; border-bottom: 1px solid #eee; color: #666;">
                ${data.name || 'Not provided'}
              </td>
            </tr>
            
            <tr>
              <td style="padding: 12px 0; border-bottom: 1px solid #eee; font-weight: bold; color: #333;">
                📧 Email
              </td>
              <td style="padding: 12px 0; border-bottom: 1px solid #eee; color: #666;">
                <a href="mailto:${data.email}" style="color: #8B4513; text-decoration: none;">
                  ${data.email || 'Not provided'}
                </a>
              </td>
            </tr>
            
            <tr>
              <td style="padding: 12px 0; border-bottom: 1px solid #eee; font-weight: bold; color: #333;">
                👥 Number of Guests
              </td>
              <td style="padding: 12px 0; border-bottom: 1px solid #eee; color: #666;">
                ${data.guests || '1'}
              </td>
            </tr>
            
            ${data.dietary ? `
            <tr>
              <td style="padding: 12px 0; border-bottom: 1px solid #eee; font-weight: bold; color: #333;">
                🥗 Dietary Restrictions
              </td>
              <td style="padding: 12px 0; border-bottom: 1px solid #eee; color: #666;">
                ${data.dietary}
              </td>
            </tr>
            ` : ''}
            
            ${data.song ? `
            <tr>
              <td style="padding: 12px 0; border-bottom: 1px solid #eee; font-weight: bold; color: #333;">
                🎵 Song Request
              </td>
              <td style="padding: 12px 0; border-bottom: 1px solid #eee; color: #666;">
                ${data.song}
              </td>
            </tr>
            ` : ''}
            
            ${data.message ? `
            <tr>
              <td style="padding: 12px 0; border-bottom: 1px solid #eee; font-weight: bold; color: #333;">
                💌 Message
              </td>
              <td style="padding: 12px 0; border-bottom: 1px solid #eee; color: #666;">
                ${data.message}
              </td>
            </tr>
            ` : ''}
            
            <tr>
              <td style="padding: 12px 0; font-weight: bold; color: #333;">
                🕒 Submitted
              </td>
              <td style="padding: 12px 0; color: #666;">
                ${new Date().toLocaleString()}
              </td>
            </tr>
          </table>
        </div>
        
        <div style="text-align: center; margin-top: 25px; color: #666; font-size: 14px;">
          <p>This email was automatically generated from your wedding website RSVP form.</p>
        </div>
      </div>
    </div>
  `;
  
  return html;
}

// Optional: Function to get RSVP statistics
function getRSVPStats() {
  try {
    var doc = SpreadsheetApp.openById(SHEET_ID);
    var sheet = doc.getSheetByName(SHEET_NAME);
    
    if (sheet.getLastRow() <= 1) {
      return {
        total: 0,
        attending: 0,
        notAttending: 0,
        totalGuests: 0
      };
    }
    
    var data = sheet.getRange(2, 1, sheet.getLastRow() - 1, sheet.getLastColumn()).getValues();
    
    var stats = {
      total: data.length,
      attending: 0,
      notAttending: 0,
      totalGuests: 0
    };
    
    data.forEach(function(row) {
      var attendanceIndex = getColumnIndex(sheet, 'attendance');
      var guestsIndex = getColumnIndex(sheet, 'guests');
      
      if (row[attendanceIndex] === 'yes') {
        stats.attending++;
        stats.totalGuests += parseInt(row[guestsIndex]) || 1;
      } else if (row[attendanceIndex] === 'no') {
        stats.notAttending++;
      }
    });
    
    return stats;
    
  } catch(e) {
    console.error('Error getting RSVP stats:', e.toString());
    return null;
  }
}

function getColumnIndex(sheet, columnName) {
  var headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
  return headers.indexOf(columnName);
}

// Optional: Function to send reminder emails (can be triggered manually or with time-based triggers)
function sendReminderEmails() {
  // This is a placeholder for reminder email functionality
  // You can expand this to send reminder emails to people who haven't RSVPed yet
  console.log('Reminder email functionality - to be implemented based on your needs');
}

// Test function - run this to test your setup
function testSetup() {
  try {
    console.log('Testing Google Apps Script setup...');
    
    // Test spreadsheet access
    var doc = SpreadsheetApp.openById(SHEET_ID);
    console.log('✅ Spreadsheet access successful');
    
    // Test sheet access
    var sheet = doc.getSheetByName(SHEET_NAME);
    console.log('✅ Sheet access successful');
    
    // Test email sending
    sendEmail({
      name: 'Test User',
      email: 'test@example.com',
      attendance: 'yes',
      guests: '2',
      dietary: 'No restrictions',
      song: 'Your Song by Elton John',
      message: 'This is a test submission'
    });
    console.log('✅ Email test completed');
    
    console.log('🎉 Setup test completed successfully!');
    
  } catch(e) {
    console.error('❌ Setup test failed:', e.toString());
  }
}
