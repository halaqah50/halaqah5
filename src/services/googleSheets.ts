import { Member, Attendance, Pembina, AttendancePembina } from '../types';

/**
 * Searches for the 'HALAQAH 5.0' spreadsheet in Google Drive.
 * If found, returns the ID, otherwise creates a new one and returns the ID.
 */
export async function findOrCreateSpreadsheet(accessToken: string): Promise<string> {
  const searchUrl = `https://www.googleapis.com/drive/v3/files?q=name='HALAQAH 5.0' and mimeType='application/vnd.google-apps.spreadsheet' and trashed=false&fields=files(id,name)`;
  
  const searchRes = await fetch(searchUrl, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });

  if (!searchRes.ok) {
    const errText = await searchRes.text();
    throw new Error(`Failed to check Google Drive: ${errText}`);
  }

  const searchData = await searchRes.json();
  if (searchData.files && searchData.files.length > 0) {
    // Found existing spreadsheet
    return searchData.files[0].id;
  }

  // Create new spreadsheet 'HALAQAH 5.0'
  const createUrl = 'https://sheets.googleapis.com/v4/spreadsheets';
  const createBody = {
    properties: {
      title: 'HALAQAH 5.0'
    },
    sheets: [
      {
        properties: { title: 'Members' },
        data: [
          {
            startRow: 0,
            startColumn: 0,
            rowData: [
              {
                values: [
                  { userEnteredValue: { stringValue: 'Nama' } },
                  { userEnteredValue: { stringValue: 'Alamat' } },
                  { userEnteredValue: { stringValue: 'Nomor WA' } },
                  { userEnteredValue: { stringValue: 'Tanggal Bergabung' } }
                ]
              }
            ]
          }
        ]
      },
      {
        properties: { title: 'Attendance' },
        data: [
          {
            startRow: 0,
            startColumn: 0,
            rowData: [
              {
                values: [
                  { userEnteredValue: { stringValue: 'Timestamp' } },
                  { userEnteredValue: { stringValue: 'Nama' } },
                  { userEnteredValue: { stringValue: 'Tanggal' } },
                  { userEnteredValue: { stringValue: 'Pertemuan' } },
                  { userEnteredValue: { stringValue: 'Status' } },
                  { userEnteredValue: { stringValue: 'Pembina' } }
                ]
              }
            ]
          }
        ]
      },
      {
        properties: { title: 'Pembina' },
        data: [
          {
            startRow: 0,
            startColumn: 0,
            rowData: [
              {
                values: [
                  { userEnteredValue: { stringValue: 'Nama' } },
                  { userEnteredValue: { stringValue: 'Alamat' } },
                  { userEnteredValue: { stringValue: 'Nomor WA' } },
                  { userEnteredValue: { stringValue: 'Tanggal Bergabung' } }
                ]
              }
            ]
          }
        ]
      },
      {
        properties: { title: 'Attendance_Pembina' },
        data: [
          {
            startRow: 0,
            startColumn: 0,
            rowData: [
              {
                values: [
                  { userEnteredValue: { stringValue: 'Timestamp' } },
                  { userEnteredValue: { stringValue: 'Nama' } },
                  { userEnteredValue: { stringValue: 'Tanggal' } },
                  { userEnteredValue: { stringValue: 'Pertemuan' } },
                  { userEnteredValue: { stringValue: 'Status' } }
                ]
              }
            ]
          }
        ]
      }
    ]
  };

  const createRes = await fetch(createUrl, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(createBody),
  });

  if (!createRes.ok) {
    const errText = await createRes.text();
    throw new Error(`Failed to create Google Spreadsheet: ${errText}`);
  }

  const createData = await createRes.json();
  return createData.spreadsheetId;
}

/**
 * Ensures that all required sheets inside the spreadsheet exist.
 * If any of them are missing, it adds them and writes the header row.
 */
export async function ensureSheetsExist(spreadsheetId: string, accessToken: string): Promise<void> {
  const getUrl = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}?fields=sheets.properties.title`;
  const res = await fetch(getUrl, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });

  if (!res.ok) {
    const errorText = await res.text();
    throw new Error(`Failed to retrieve spreadsheet metadata: ${errorText}`);
  }

  const data = await res.json();
  const existingTitles: string[] = (data.sheets || []).map((s: any) => s.properties?.title).filter(Boolean);

  const expectedSheets = [
    {
      title: 'Members',
      headers: ['Nama', 'Alamat', 'Nomor WA', 'Tanggal Bergabung'],
      range: 'Members!A1:D1'
    },
    {
      title: 'Attendance',
      headers: ['Timestamp', 'Nama', 'Tanggal', 'Pertemuan', 'Status', 'Pembina'],
      range: 'Attendance!A1:F1'
    },
    {
      title: 'Pembina',
      headers: ['Nama', 'Alamat', 'Nomor WA', 'Tanggal Bergabung'],
      range: 'Pembina!A1:D1'
    },
    {
      title: 'Attendance_Pembina',
      headers: ['Timestamp', 'Nama', 'Tanggal', 'Pertemuan', 'Status'],
      range: 'Attendance_Pembina!A1:E1'
    }
  ];

  const missingSheets = expectedSheets.filter(es => !existingTitles.includes(es.title));

  if (missingSheets.length === 0) {
    return; // All necessary sheets are present, nothing to do.
  }

  // Create missing sheets via batchUpdate
  const batchUpdateUrl = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}:batchUpdate`;
  const batchUpdateBody = {
    requests: missingSheets.map(ms => ({
      addSheet: {
        properties: { title: ms.title }
      }
    }))
  };

  const updateRes = await fetch(batchUpdateUrl, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(batchUpdateBody)
  });

  if (!updateRes.ok) {
    const errorText = await updateRes.text();
    throw new Error(`Failed to create missing sheets: ${errorText}`);
  }

  // Write headers for newly created sheets
  const valuesUpdateUrl = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values:batchUpdate`;
  const valuesUpdateBody = {
    valueInputOption: 'USER_ENTERED',
    data: missingSheets.map(ms => ({
      range: ms.range,
      values: [ms.headers]
    }))
  };

  const valuesRes = await fetch(valuesUpdateUrl, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(valuesUpdateBody)
  });

  if (!valuesRes.ok) {
    const errorText = await valuesRes.text();
    throw new Error(`Failed to write headers for new sheets: ${errorText}`);
  }
}

/**
 * Fetches all Halaqah data in a single batchGet request.
 */
export async function fetchHalaqahData(
  spreadsheetId: string,
  accessToken: string
): Promise<{
  members: Member[];
  attendance: Attendance[];
  pembina: Pembina[];
  attendancePembina: AttendancePembina[];
}> {
  // Ensure that all required sheets exist and are formatted with headers
  await ensureSheetsExist(spreadsheetId, accessToken);

  const ranges = ['Members!A2:D1000', 'Attendance!A2:F5000', 'Pembina!A2:D1000', 'Attendance_Pembina!A2:E2000'];
  const queryRanges = ranges.map(r => `ranges=${encodeURIComponent(r)}`).join('&');
  const url = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values:batchGet?${queryRanges}&majorDimension=ROWS`;

  const res = await fetch(url, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });

  if (!res.ok) {
    const errorText = await res.text();
    throw new Error(`Failed to fetch data from spreadsheet: ${errorText}`);
  }

  const data = await res.json();
  const valueRanges = data.valueRanges || [];

  // Parse Members (range index 0)
  const membersRows = valueRanges[0]?.values || [];
  const members: Member[] = membersRows.map((row: string[]) => ({
    nama: row[0] || '',
    alamat: row[1] || '',
    nomorWA: row[2] || '',
    tanggalBergabung: row[3] || '',
  })).filter((m: Member) => m.nama !== '');

  // Parse Attendance (range index 1)
  const attendanceRows = valueRanges[1]?.values || [];
  const attendance: Attendance[] = attendanceRows.map((row: string[]) => ({
    timestamp: row[0] || '',
    nama: row[1] || '',
    tanggal: row[2] || '',
    pertemuan: row[3] || '',
    status: (row[4] as any) || 'Hadir',
    pembina: row[5] || '',
  })).filter((a: Attendance) => a.nama !== '');

  // Parse Pembina (range index 2)
  const pembinaRows = valueRanges[2]?.values || [];
  const pembina: Pembina[] = pembinaRows.map((row: string[]) => ({
    nama: row[0] || '',
    alamat: row[1] || '',
    nomorWA: row[2] || '',
    tanggalBergabung: row[3] || '',
  })).filter((p: Pembina) => p.nama !== '');

  // Parse Attendance Pembina (range index 3)
  const attendancePembinaRows = valueRanges[3]?.values || [];
  const attendancePembina: AttendancePembina[] = attendancePembinaRows.map((row: string[]) => ({
    timestamp: row[0] || '',
    nama: row[1] || '',
    tanggal: row[2] || '',
    pertemuan: row[3] || '',
    status: (row[4] as any) || 'Hadir',
  })).filter((ap: AttendancePembina) => ap.nama !== '');

  return { members, attendance, pembina, attendancePembina };
}

/**
 * Appends a row to a specific Sheet in Google Sheets.
 */
async function appendRow(
  spreadsheetId: string,
  accessToken: string,
  tabName: string,
  range: string,
  values: string[]
): Promise<void> {
  const url = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${encodeURIComponent(tabName + '!' + range)}:append?valueInputOption=USER_ENTERED`;
  const res = await fetch(url, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      values: [values],
    }),
  });

  if (!res.ok) {
    const errorText = await res.text();
    throw new Error(`Failed to append row to ${tabName}: ${errorText}`);
  }
}

export async function addMember(
  spreadsheetId: string,
  accessToken: string,
  member: Member
): Promise<void> {
  await appendRow(spreadsheetId, accessToken, 'Members', 'A:D', [
    member.nama,
    member.alamat,
    member.nomorWA,
    member.tanggalBergabung,
  ]);
}

export async function addAttendance(
  spreadsheetId: string,
  accessToken: string,
  attendance: Attendance
): Promise<void> {
  await appendRow(spreadsheetId, accessToken, 'Attendance', 'A:F', [
    attendance.timestamp,
    attendance.nama,
    attendance.tanggal,
    attendance.pertemuan,
    attendance.status,
    attendance.pembina,
  ]);
}

export async function addPembina(
  spreadsheetId: string,
  accessToken: string,
  pembina: Pembina
): Promise<void> {
  await appendRow(spreadsheetId, accessToken, 'Pembina', 'A:D', [
    pembina.nama,
    pembina.alamat,
    pembina.nomorWA,
    pembina.tanggalBergabung,
  ]);
}

export async function addAttendancePembina(
  spreadsheetId: string,
  accessToken: string,
  attendance: AttendancePembina
): Promise<void> {
  await appendRow(spreadsheetId, accessToken, 'Attendance_Pembina', 'A:E', [
    attendance.timestamp,
    attendance.nama,
    attendance.tanggal,
    attendance.pertemuan,
    attendance.status,
  ]);
}
