import { Document, Page, Text, View, StyleSheet, Image } from '@react-pdf/renderer';
import { format } from 'date-fns';

const styles = StyleSheet.create({
  page: {
    padding: 30,
    fontFamily: 'Helvetica',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 30,
    alignItems: 'center',
  },
  logo: {
    width: 200,
    height: 80,
    objectFit: 'contain',
  },
  headerRight: {
    flexDirection: 'column',
    alignItems: 'flex-end',
    justifyContent: 'center',
  },
  title: {
    fontSize: 24,
    color: '#0EA5E9',
    marginBottom: 5,
  },
  subtitle: {
    fontSize: 12,
    color: '#64748B',
  },
  stats: {
    flexDirection: 'row',
    gap: 20,
    marginBottom: 30,
  },
  statBox: {
    flex: 1,
    padding: 15,
    backgroundColor: '#F8FAFC',
    borderRadius: 4,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  statTitle: {
    fontSize: 12,
    color: '#64748B',
    marginBottom: 5,
  },
  statValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#0EA5E9',
  },
  table: {
    width: '100%',
    marginTop: 20,
  },
  tableHeader: {
    flexDirection: 'row',
    backgroundColor: '#0EA5E9',
    padding: 10,
    color: 'white',
    fontSize: 12,
    fontWeight: 'bold',
  },
  tableRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
    padding: 10,
    fontSize: 10,
  },
  tableCell: {
    flex: 1,
  },
  tableCellWide: {
    flex: 2,
  },
  statusBadge: {
    padding: 4,
    borderRadius: 4,
    fontSize: 10,
    textAlign: 'center',
    width: '80%',
  },
  footer: {
    position: 'absolute',
    bottom: 30,
    left: 30,
    right: 30,
    textAlign: 'center',
    color: '#64748B',
    fontSize: 10,
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
    paddingTop: 10,
  },
});

interface SalesReportPDFProps {
  sales: {
    id: string;
    customer_name: string;
    invoice_number: string;
    total_amount: number;
    status: 'pending' | 'approved' | 'rejected';
    created_at: string;
  }[];
  totalAmount: number;
  dateFilter?: {
    type: 'single' | 'range';
    date?: Date;
    dateRange?: {
      startDate: Date;
      endDate: Date;
    };
  };
  logo: string;
}

export const SalesReportPDF = ({ 
  sales, 
  totalAmount,
  dateFilter,
  logo 
}: SalesReportPDFProps) => (
  <Document>
    <Page size="A4" style={styles.page}>
      <View style={styles.header}>
        <Image 
          src={logo}
          style={styles.logo}
        />
        <View style={styles.headerRight}>
          <Text style={styles.title}>Sales Report</Text>
          <Text style={styles.subtitle}>
            Generated on {format(new Date(), "dd/MM/yyyy HH:mm")}
          </Text>
          {dateFilter && (
            <Text style={styles.subtitle}>
              {dateFilter.type === 'single' && dateFilter.date
                ? `Date: ${format(dateFilter.date, "dd/MM/yyyy")}`
                : dateFilter.type === 'range' && dateFilter.dateRange
                ? `Period: ${format(dateFilter.dateRange.startDate, "dd/MM/yyyy")} - ${format(dateFilter.dateRange.endDate, "dd/MM/yyyy")}`
                : null
              }
            </Text>
          )}
        </View>
      </View>

      <View style={styles.stats}>
        <View style={styles.statBox}>
          <Text style={styles.statTitle}>Total Sales</Text>
          <Text style={styles.statValue}>KES {totalAmount.toLocaleString()}</Text>
        </View>
        <View style={styles.statBox}>
          <Text style={styles.statTitle}>Number of Sales</Text>
          <Text style={styles.statValue}>{sales.length}</Text>
        </View>
        <View style={styles.statBox}>
          <Text style={styles.statTitle}>Average Sale</Text>
          <Text style={styles.statValue}>
            KES {(totalAmount / (sales.length || 1)).toLocaleString()}
          </Text>
        </View>
      </View>

      <View style={styles.table}>
        <View style={styles.tableHeader}>
          <Text style={styles.tableCellWide}>Customer</Text>
          <Text style={styles.tableCell}>Invoice No.</Text>
          <Text style={styles.tableCell}>Amount</Text>
          <Text style={styles.tableCell}>Status</Text>
          <Text style={styles.tableCell}>Date</Text>
        </View>

        {sales.map((sale, index) => (
          <View key={index} style={[styles.tableRow, 
            index % 2 === 0 ? { backgroundColor: '#F8FAFC' } : {}
          ]}>
            <Text style={styles.tableCellWide}>{sale.customer_name || 'N/A'}</Text>
            <Text style={styles.tableCell}>{sale.invoice_number || 'N/A'}</Text>
            <Text style={styles.tableCell}>
              KES {(sale.total_amount || 0).toLocaleString()}
            </Text>
            <View style={styles.tableCell}>
              <Text style={[
                styles.statusBadge,
                sale.status === 'approved'
                  ? { backgroundColor: '#DCFCE7', color: '#16A34A' }
                  : sale.status === 'pending'
                  ? { backgroundColor: '#FEF3C7', color: '#D97706' }
                  : { backgroundColor: '#FEE2E2', color: '#DC2626' }
              ]}>
                {sale.status ? sale.status.charAt(0).toUpperCase() + sale.status.slice(1) : 'N/A'}
              </Text>
            </View>
            <Text style={styles.tableCell}>
              {sale.created_at ? format(new Date(sale.created_at), "dd/MM/yyyy") : 'N/A'}
            </Text>
          </View>
        ))}
      </View>

      <Text style={styles.footer}>
        Aquatreat Solutions Ltd. - Water & Effluent Treatment Specialists
      </Text>
    </Page>
  </Document>
); 