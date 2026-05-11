const PROVINCE_FOLDER_ID = '1nc7O3Xm2bAxZFBZHilOY5kujgns1RdMD';
const SHEET_NAME = 'KPI69';
const CACHE_SECONDS = 600;

function doGet() {
  return HtmlService.createTemplateFromFile('Index')
    .evaluate()
    .setTitle('CDDWomen Dashboard')
    .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL)
    .addMetaTag('viewport', 'width=device-width, initial-scale=1');
}

function include(filename) {
  return HtmlService.createHtmlOutputFromFile(filename).getContent();
}

function getProvinceList() {
  return {
    success: true,
    provinces: ['กาญจนบุรี', 'ฉะเชิงเทรา', 'นครราชสีมา','ขอนแก่น', 'เชียงใหม่', 'สงขลา','อ่างทอง','กรุงเทพมหานคร']
  };
}



function getDashboardData(provinceName) {
  const targetProvince = (provinceName || 'นครราชสีมา').trim();
  const cache = CacheService.getScriptCache();
  const cacheKey = 'dashboard_' + targetProvince;
  const cached = cache.get(cacheKey);

  if (cached) return JSON.parse(cached);

  const folder = DriveApp.getFolderById(PROVINCE_FOLDER_ID);
  const files = folder.getFiles();

  const rawData = [];
  const fileErrors = [];
  let foundFile = false;

  while (files.hasNext()) {
    const file = files.next();
    if (file.getMimeType() !== MimeType.GOOGLE_SHEETS) continue;

    const fileProvince = extractProvinceFromFileName(file.getName());
    if (fileProvince !== targetProvince) continue;

    foundFile = true;

    try {
      const ss = SpreadsheetApp.openById(file.getId());
      const sheet = ss.getSheetByName(SHEET_NAME);

      if (!sheet) {
        fileErrors.push(`ไม่พบชีต ${SHEET_NAME} ในไฟล์ ${file.getName()}`);
        continue;
      }

      const lastRow = sheet.getLastRow();
      const lastCol = sheet.getLastColumn();
      if (lastRow < 2 || lastCol < 1) continue;

      const values = sheet.getRange(1, 1, lastRow, lastCol).getDisplayValues();
      const headers = values[0].map(h => String(h || '').trim());
      const rows = values.slice(1);

      const colIdx = createHeaderMap_(headers);

      const proposerIdx = findHeaderIndex_(headers, h =>
        h.includes('ผู้เสนอโครงการ') || h.includes('ผู้ร่วมโครงการ')
      );

      const idxYear = 4; // ปีงบประมาณ E

      const idxProvince = colIdx['จังหวัด'];
      const idxDistrict = colIdx['อำเภอ/เขต'];
      const idxSubdistrict = colIdx['ตำบล'];
      const idxStatus = colIdx['สถานะโครงการ'];
      const idxLegalStatus = 63;     // BL ประเภทคดี(AX)
const idxLegalCaseAmount = 64; // BM จำนวนเงินคดี(AY)
const idxMeasure = 65;         // BN มาตรการ

      const idxProjectName = colIdx['ชื่อโครงการ'];
      const idxPhone = colIdx['เบอร์โทร'];
      const idxRemark = colIdx['หมายเหตุ'];
      const idxRemarkProv = colIdx['*หมายเหตุจากจว.*'];
      const idxEndDate = colIdx['วันที่สิ้นสุดสัญญา'];
      const idxDueDate = colIdx['กำหนดวันชำระเงินงวดสุดท้ายที่ไม่มีการรับชำระ'];
      const idxContractNo = 5; // F เลขที่สัญญา
      const idxIdCard = colIdx['เลขบัตรประชาชน'];
      const idxIdCard2 = colIdx['เลขบัตรประจำตัวประชาชน'];
      const idxApproved = 10; // เงินอนุมัติ K
  const idxAccountPrincipal = colIdx['เงินต้นปีบัญชี ณ 1/10/2568 (A)'];
const idxRemaining = firstMatchedHeaderIndex_(headers, [
  'ลูกหนี้คงเหลือ (ก)',
  'ลูกหนี้คงเหลือ(ก)',
  'ลูกหนี้คงเหลือ',
  'ลูกหนี้คงเหลือ ( ก )'
]);

const idxInterestRemaining = firstMatchedHeaderIndex_(headers, [
  'ดอกเบี้ยคงเหลือ',
  'ดอกเบี้ยคงเหลือ AM'
]);

const idxPenaltyRemaining = firstMatchedHeaderIndex_(headers, [
  'เบี้ยปรับคงเหลือ',
  'เบี้ยปรับคงเหลือ AN'
]);

const idxDefaultInterestRemaining = firstMatchedHeaderIndex_(headers, [
  'ดอกเบี้ยผิดนัดคงเหลือ',
  'ดอกเบี้ยผิดนัดคงเหลือ AO'
]);

const idxTotalRemaining = firstMatchedHeaderIndex_(headers, [
  'รวมคงเหลือ',
  'รวมคงเหลือ AP'
]);




const idxPaid = colIdx['เงินต้นรับชำระ (สะสม)'];
const idxPaidOpening = firstMatchedHeaderIndex_(headers, [
  'เงินต้นรับชำระ (ต้นปีบัญชี)',
  'เงินต้นรับชำระ(ต้นปีบัญชี)',
  'เงินต้นรับชำระ ต้นปีบัญชี',
  'เงินต้นรับชำระ ณ ต้นปีบัญชี',
  'เงินต้นรับชำระ'
]);
const idxOverdue = colIdx['จำนวนหนี้ที่เกินกำหนดชำระ (B)'];
const idxLegal = firstMatchedHeaderIndex_(headers, [
  'ลูกหนี้ที่ดำเนินการตามกฎหมาย (ค+ง)',
  'ลูกหนี้ที่ได้ดำเนินการตามกฎหมาย(ค+ง)',
  'ลูกหนี้ที่ได้ดำเนินการตามกฎหมาย (ง)',
  'ลูกหนี้ที่ได้ดำเนินการตามกฎหมาย'
]);
const idxPercentLegal = firstMatchedHeaderIndex_(headers, [
  'ร้อยละหนี้ที่ดำเนินการตามกฎหมาย',
  'ร้อยละหนี้ที่ดำเนินการตามกฎหมาย',
  'ร้อยละหนี้ (กฎหมาย)'
]);
      const idxPercentOverdue = colIdx['ร้อยละหนี้เกินกำหนดชำระ (C)'];
      const idxPercentOverdue2 = colIdx['ร้อยละหนี้เกินกำหนด (C)'];

      for (let i = 0; i < rows.length; i++) {
        const row = rows[i];
        const district = getByIndex_(row, idxDistrict);
        if (!district) continue;

        rawData.push({
  sourceFileId: file.getId(),
  sourceFileName: file.getName(),

  year: getByIndex_(row, idxYear) || 'ไม่ระบุ',
  measure: getByIndex_(row, idxMeasure) || 'ไม่ระบุ',
  province: getByIndex_(row, idxProvince) || targetProvince,
  district: district || 'ไม่ระบุ',
  subdistrict: getByIndex_(row, idxSubdistrict) || 'ไม่ระบุ',
  status: getByIndex_(row, idxStatus) || 'ไม่ระบุ',
  legalStatus: getByIndex_(row, idxLegalStatus) || 'ไม่ระบุ',

  projectName: getByIndex_(row, idxProjectName) || 'ไม่ระบุ',
  proposer: getByIndex_(row, proposerIdx) || 'ไม่ระบุ',
  phone: getByIndex_(row, idxPhone) || 'ไม่มีข้อมูล',
  remark: getByIndex_(row, idxRemark) || '',
  remarkProv: getByIndex_(row, idxRemarkProv) || 'ไม่มีข้อมูล',
  endDateStr: getByIndex_(row, idxEndDate) || '',
  dueDateStr: getByIndex_(row, idxDueDate) || '',

  contractNo: getByIndex_(row, idxContractNo) || '',
  idCard: getByIndex_(row, idxIdCard) || getByIndex_(row, idxIdCard2) || '',

  approved: toNumber_(getByIndex_(row, idxApproved)),
  accountPrincipal: toNumber_(getByIndex_(row, idxAccountPrincipal)),
  remaining: toNumber_(getByIndex_(row, idxRemaining)),

  interestRemaining: toNumber_(getByIndex_(row, idxInterestRemaining)),
penaltyRemaining: toNumber_(getByIndex_(row, idxPenaltyRemaining)),
defaultInterestRemaining: toNumber_(getByIndex_(row, idxDefaultInterestRemaining)),
totalRemaining: toNumber_(getByIndex_(row, idxTotalRemaining)),



  paid: toNumber_(getByIndex_(row, idxPaid)),
  paidOpening: toNumber_(getByIndex_(row, idxPaidOpening)),

  overdue: toNumber_(getByIndex_(row, idxOverdue)),
legal: toNumber_(getByIndex_(row, idxLegalCaseAmount)),

  // ✅ เพิ่มบรรทัดนี้
  percentLegal: toNumber_(getByIndex_(row, idxPercentLegal)),

  percentOverdue: toNumber_(
    getByIndex_(row, idxPercentOverdue) || getByIndex_(row, idxPercentOverdue2)
  )
});
      }

      break; // เจอจังหวัดแล้ว ไม่ต้องวนไฟล์ต่อ
    } catch (err) {
      fileErrors.push(`ไฟล์ ${file.getName()}: ${err.message}`);
    }
  }

  const result = {
  success: true,
  province: targetProvince,
  foundFile,
  count: rawData.length,
  filesWithError: fileErrors,
  data: rawData,
 summary: {
  approved: rawData.reduce((s, r) => s + Number(r.approved || 0), 0),

  accountPrincipal: rawData.reduce((s, r) => s + Number(r.accountPrincipal || 0), 0),

  remaining: rawData.reduce((s, r) => s + Number(r.remaining || 0), 0),

  interestRemaining: rawData.reduce((s, r) => s + Number(r.interestRemaining || 0), 0),

  penaltyRemaining: rawData.reduce((s, r) => s + Number(r.penaltyRemaining || 0), 0),

  defaultInterestRemaining: rawData.reduce((s, r) => s + Number(r.defaultInterestRemaining || 0), 0),

  totalRemaining: rawData.reduce((s, r) => s + Number(r.totalRemaining || 0), 0),

  paidOpening: rawData.reduce((s, r) => s + Number(r.paidOpening || 0), 0),

  paid: rawData.reduce((s, r) => s + Number(r.paid || 0), 0),

  overdue: rawData.reduce((s, r) => s + Number(r.overdue || 0), 0),

  legal: rawData.reduce((s, r) => s + Number(r.legal || 0), 0)
}
};

  try {
    cache.put(cacheKey, JSON.stringify(result), CACHE_SECONDS);
  } catch (e) {}

  return result;
}

function clearProvinceCache(provinceName) {
  const key = 'dashboard_' + String(provinceName || '').trim();
  CacheService.getScriptCache().remove(key);
  return { success: true, message: 'clear province cache สำเร็จ' };
}

function createHeaderMap_(headers) {
  const normalize = s =>
    String(s || '')
      .replace(/[\n\r]+/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();

  const map = {};
  for (let i = 0; i < headers.length; i++) {
    map[normalize(headers[i])] = i;
  }
  return map;
}

function findHeaderIndex_(headers, predicate) {
  for (let i = 0; i < headers.length; i++) {
    if (predicate(headers[i])) return i;
  }
  return -1;
}

function getByIndex_(row, idx) {
  if (idx === undefined || idx === null || idx < 0) return '';
  return String(row[idx] || '').trim();
}

function toNumber_(value) {
  const raw = String(value || '').trim();
  if (!raw) return 0;
  const cleaned = raw.replace(/[,%]/g, '').replace(/,/g, '').trim();
  const n = Number(cleaned);
  return isNaN(n) ? 0 : n;
}

function extractProvinceFromFileName(fileName) {
  return String(fileName || '').replace(/KPI.*$/i, '').replace(/_/g, ' ').trim();
  
}

function firstMatchedHeaderIndex_(headers, candidates) {
  const normalize = s =>
    String(s || '')
      .replace(/[\n\r]+/g, ' ')   // ✅ แก้ newline โดยตรง
      .replace(/\s+/g, ' ')
      .trim();

  const normalizedHeaders = headers.map(normalize);

  for (let i = 0; i < candidates.length; i++) {
    const target = normalize(candidates[i]);
    const idx = normalizedHeaders.findIndex(h => h.includes(target)); // ✅ ใช้ includes แทน ===
    if (idx > -1) return idx;
  }
  return -1;
}







