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
    paddingHorizontal: 4,
  },
  tableCellDate: {
    width: '12%',
    paddingHorizontal: 4,
  },
  tableCellLocation: {
    width: '15%',
    paddingHorizontal: 4,
  },
  tableCellItems: {
    width: '10%',
    paddingHorizontal: 4,
    textAlign: 'center',
  },
  tableCellStatus: {
    width: '15%',
    paddingHorizontal: 4,
  },
  statusBadge: {
    padding: 4,
    borderRadius: 4,
    fontSize: 10,
    textAlign: 'center',
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

interface TransfersReportPDFProps {
  transfers: {
    id: string;
    transfer_number: string;
    from_location: string;
    to_location: string;
    total_items: number;
    status: 'pending' | 'completed' | 'cancelled';
    created_at: string;
  }[];
  totalTransfers: number;
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

export const TransfersReportPDF = ({ 
  transfers, 
  totalTransfers,
  dateFilter,
  logo 
}: TransfersReportPDFProps) => (
  <Document>
    <Page size="A4" style={styles.page}>
      <View style={styles.header}>
        <Image 
          src={logo}
          style={styles.logo}
        />
        <View style={styles.headerRight}>
          <Text style={styles.title}>Transfers Report</Text>
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
          <Text style={styles.statTitle}>Total Transfers</Text>
          <Text style={styles.statValue}>{totalTransfers}</Text>
        </View>
        <View style={styles.statBox}>
          <Text style={styles.statTitle}>Pending Transfers</Text>
          <Text style={styles.statValue}>
            {transfers.filter(t => t.status === 'pending').length}
          </Text>
        </View>
        <View style={styles.statBox}>
          <Text style={styles.statTitle}>Completed Transfers</Text>
          <Text style={styles.statValue}>
            {transfers.filter(t => t.status === 'completed').length}
          </Text>
        </View>
      </View>

      <View style={styles.table}>
        <View style={styles.tableHeader}>
          <Text style={styles.tableCellDate}>Date</Text>
          <Text style={styles.tableCellLocation}>From</Text>
          <Text style={styles.tableCellLocation}>To</Text>
          <Text style={styles.tableCellItems}>Items</Text>
          <Text style={styles.tableCellStatus}>Status</Text>
          <Text style={styles.tableCellDate}>Transfer No.</Text>
        </View>

        {transfers.map((transfer, index) => (
          <View key={index} style={[styles.tableRow, 
            index % 2 === 0 ? { backgroundColor: '#F8FAFC' } : {}
          ]}>
            <Text style={styles.tableCellDate}>
              {transfer.created_at ? format(new Date(transfer.created_at), "dd/MM/yyyy") : 'N/A'}
            </Text>
            <Text style={styles.tableCellLocation}>{transfer.from_location || 'N/A'}</Text>
            <Text style={styles.tableCellLocation}>{transfer.to_location || 'N/A'}</Text>
            <Text style={styles.tableCellItems}>{transfer.total_items}</Text>
            <View style={styles.tableCellStatus}>
              <Text style={[
                styles.statusBadge,
                transfer.status === 'completed'
                  ? { backgroundColor: '#DCFCE7', color: '#16A34A' }  // Green for completed
                  : transfer.status === 'pending'
                  ? { backgroundColor: '#FEF3C7', color: '#D97706' }  // Yellow for pending
                  : { backgroundColor: '#FEE2E2', color: '#DC2626' }  // Red for cancelled
              ]}>
                {transfer.status.charAt(0).toUpperCase() + transfer.status.slice(1)}
              </Text>
            </View>
            <Text style={styles.tableCellDate}>{transfer.transfer_number}</Text>
          </View>
        ))}
      </View>

      <Text style={styles.footer}>
        Aquatreat Solutions Ltd. - Water & Effluent Treatment Specialists
      </Text>
    </Page>
  </Document>
); 