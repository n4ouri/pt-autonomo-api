/**
 * SAFT-PT (Standard Audit File for Tax Purposes - Portuguese version)
 * Generator for Accounting and Billing standard files.
 */

function escapeXml(unsafe) {
  if (typeof unsafe !== 'string') return unsafe;
  return unsafe.replace(/[<>&'"]/g, function (c) {
    switch (c) {
      case '<': return '&lt;';
      case '>': return '&gt;';
      case '&': return '&amp;';
      case '\\'': return '&apos;';
      case '"': return '&quot;';
    }
  });
}

function objToXml(obj, indent = '') {
  let xml = '';
  for (const key in obj) {
    if (obj.hasOwnProperty(key)) {
      const val = obj[key];
      if (Array.isArray(val)) {
        for (const item of val) {
          xml += `${indent}<${key}>\n${objToXml(item, indent + '  ')}${indent}</${key}>\n`;
        }
      } else if (typeof val === 'object' && val !== null) {
        xml += `${indent}<${key}>\n${objToXml(val, indent + '  ')}${indent}</${key}>\n`;
      } else {
        xml += `${indent}<${key}>${escapeXml(val)}</${key}>\n`;
      }
    }
  }
  return xml;
}

export function generateSAFT({ 
  companyName = 'Desconhecido', 
  companyNIPC = '999999990', 
  year = new Date().getFullYear(), 
  month = new Date().getMonth() + 1, 
  invoices = [], 
  ledgerTransactions = [],
  saftType = 'F' // 'F' for Faturação, 'C' for Contabilidade
}) {
  const currentDate = new Date().toISOString().split('T')[0];

  const header = {
    AuditFileVersion: '1.04_01',
    CompanyID: companyNIPC,
    TaxRegistrationNumber: companyNIPC,
    TaxAccountingBasis: saftType === 'F' ? 'F' : 'C',
    CompanyName: companyName,
    BusinessName: companyName,
    CompanyAddress: {
      Detail: 'Sede Principal',
      City: 'Lisboa',
      PostalCode: '1000-001',
      Country: 'PT'
    },
    FiscalYear: year,
    StartDate: `${year}-${String(month).padStart(2, '0')}-01`,
    EndDate: `${year}-${String(month).padStart(2, '0')}-28`, // simplified
    CurrencyCode: 'EUR',
    DateCreated: currentDate,
    TaxEntity: 'Global',
    ProductCompanyTaxID: '517551624',
    SoftwareCertificateNumber: '0',
    ProductID: 'tax-verde/pt-autonomo-api',
    ProductVersion: '1.0.0'
  };

  const masterFiles = {
    Customer: [], // Map from invoices
    TaxTable: {
      TaxTableEntry: [
        { TaxType: 'IVA', TaxCountryRegion: 'PT', TaxCode: 'NOR', Description: 'Normal Rate', TaxPercentage: 23 },
        { TaxType: 'IVA', TaxCountryRegion: 'PT', TaxCode: 'ISE', Description: 'Exempt', TaxPercentage: 0 }
      ]
    }
  };

  const customerSet = new Set();
  for (const inv of invoices) {
    if (!customerSet.has(inv.customerNIF)) {
      masterFiles.Customer.push({
        CustomerID: inv.customerNIF,
        AccountID: 'Desconhecido',
        CustomerTaxID: inv.customerNIF,
        CompanyName: inv.customerName,
        BillingAddress: {
          Detail: 'Desconhecido',
          City: 'Desconhecido',
          PostalCode: '0000-000',
          Country: inv.customerCountry || 'PT'
        },
        SelfBillingIndicator: 0
      });
      customerSet.add(inv.customerNIF);
    }
  }

  const sourceDocuments = {};

  if (saftType === 'F' || saftType === 'I') {
    let totalCredit = 0;
    let totalDebit = 0;
    const salesInvoices = invoices.map((inv, index) => {
      totalCredit += inv.totalAmount;
      return {
        InvoiceNo: `FT ${year}/${index + 1}`,
        ATCUD: '0',
        DocumentStatus: {
          InvoiceStatus: 'N',
          InvoiceStatusDate: inv.date,
          SourceID: 'API',
          SourceBilling: 'P'
        },
        Hash: '0',
        HashControl: '1',
        Period: month,
        InvoiceDate: inv.date,
        InvoiceType: 'FT',
        SpecialRegimes: {
          SelfBillingIndicator: 0,
          CashVATSchemeIndicator: 0,
          ThirdPartiesBillingIndicator: 0
        },
        SourceID: 'API',
        SystemEntryDate: inv.date + 'T12:00:00',
        CustomerID: inv.customerNIF,
        Line: inv.lines.map((l, lIdx) => ({
          LineNumber: lIdx + 1,
          ProductCode: 'SERVICO',
          ProductDescription: l.description,
          Quantity: 1,
          UnitOfMeasure: 'Unidade',
          UnitPrice: l.amount,
          TaxPointDate: inv.date,
          Description: l.description,
          CreditAmount: l.amount,
          Tax: {
            TaxType: 'IVA',
            TaxCountryRegion: 'PT',
            TaxCode: l.taxRate > 0 ? 'NOR' : 'ISE',
            TaxPercentage: l.taxRate
          }
        })),
        DocumentTotals: {
          TaxPayable: inv.taxAmount,
          NetTotal: inv.netAmount,
          GrossTotal: inv.totalAmount
        }
      };
    });

    sourceDocuments.SalesInvoices = {
      NumberOfEntries: salesInvoices.length,
      TotalDebit: totalDebit,
      TotalCredit: totalCredit,
      Invoice: salesInvoices
    };
  }

  const rootObj = {
    AuditFile: {
      Header: header,
      MasterFiles: masterFiles,
      SourceDocuments: sourceDocuments
    }
  };

  const xmlContent = `<?xml version="1.0" encoding="UTF-8"?>
<AuditFile xmlns="urn:OECD:StandardAuditFile-Tax:PT_1.04_01">
${objToXml(rootObj.AuditFile, '  ')}
</AuditFile>`;

  return { xml: xmlContent, json: rootObj };
}
