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
    color: '#0EA5E9', // Light blue color
    marginBottom: 5,
  },
  subtitle: {
    fontSize: 12,
    color: '#64748B', // Slate-500
  },
  stats: {
    flexDirection: 'row',
    gap: 20,
    marginBottom: 30,
  },
  statBox: {
    flex: 1,
    padding: 15,
    backgroundColor: '#F8FAFC', // Slate-50
    borderRadius: 4,
    borderWidth: 1,
    borderColor: '#E2E8F0', // Slate-200
  },
  statTitle: {
    fontSize: 12,
    color: '#64748B', // Slate-500
    marginBottom: 5,
  },
  statValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#0EA5E9', // Light blue color
  },
  table: {
    width: '100%',
    marginTop: 20,
  },
  tableHeader: {
    flexDirection: 'row',
    backgroundColor: '#0EA5E9', // Light blue color
    padding: 10,
    color: 'white',
    fontSize: 12,
    fontWeight: 'bold',
  },
  tableRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0', // Slate-200
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
    color: '#64748B', // Slate-500
    fontSize: 10,
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0', // Slate-200
    paddingTop: 10,
  },
});

interface InventoryReportPDFProps {
  products: any[];
  totalProducts: number;
  lowStockProducts: number;
  outOfStockProducts: number;
  selectedLocation: string;
  logo: string;
}

export const InventoryReportPDF = ({ 
  products, 
  totalProducts, 
  lowStockProducts, 
  outOfStockProducts,
  selectedLocation,
  logo
}: InventoryReportPDFProps) => (
  <Document>
    <Page size="A4" style={styles.page}>
      <View style={styles.header}>
        <Image 
          src={logo}
          style={styles.logo}
        />
        <View style={styles.headerRight}>
          <Text style={styles.title}>Inventory Report</Text>
          <Text style={styles.subtitle}>
            Generated on {format(new Date(), "dd/MM/yyyy HH:mm")}
          </Text>
          {selectedLocation !== 'all' && (
            <Text style={styles.subtitle}>
              Location: {selectedLocation} Store
            </Text>
          )}
        </View>
      </View>

      <View style={styles.stats}>
        <View style={styles.statBox}>
          <Text style={styles.statTitle}>Total Products</Text>
          <Text style={styles.statValue}>{totalProducts}</Text>
        </View>
        <View style={styles.statBox}>
          <Text style={styles.statTitle}>Low Stock Items</Text>
          <Text style={styles.statValue}>{lowStockProducts}</Text>
        </View>
        <View style={styles.statBox}>
          <Text style={styles.statTitle}>Out of Stock</Text>
          <Text style={styles.statValue}>{outOfStockProducts}</Text>
        </View>
      </View>

      <View style={styles.table}>
        <View style={styles.tableHeader}>
          <Text style={styles.tableCellWide}>Product Name</Text>
          <Text style={styles.tableCell}>Location</Text>
          <Text style={styles.tableCell}>Current Stock</Text>
          <Text style={styles.tableCell}>Min. Stock</Text>
          <Text style={styles.tableCell}>Status</Text>
        </View>

        {products.map((product, index) => (
          <View key={index} style={[styles.tableRow, 
            index % 2 === 0 ? { backgroundColor: '#F8FAFC' } : {}
          ]}>
            <Text style={styles.tableCellWide}>{product.name}</Text>
            <Text style={styles.tableCell}>{product.inventory[0].location}</Text>
            <Text style={styles.tableCell}>{product.inventory[0].quantity}</Text>
            <Text style={styles.tableCell}>{product.min_stock_level}</Text>
            <View style={styles.tableCell}>
              <Text style={[
                styles.statusBadge,
                product.inventory[0].quantity === 0
                  ? { backgroundColor: '#FEE2E2', color: '#DC2626' }
                  : product.inventory[0].quantity <= product.min_stock_level
                  ? { backgroundColor: '#FEF3C7', color: '#D97706' }
                  : { backgroundColor: '#DCFCE7', color: '#16A34A' }
              ]}>
                {product.inventory[0].quantity === 0
                  ? "Out of Stock"
                  : product.inventory[0].quantity <= product.min_stock_level
                  ? "Low Stock"
                  : "In Stock"}
              </Text>
            </View>
          </View>
        ))}
      </View>

      <Text style={styles.footer}>
        Aquatreat Solutions Ltd. - Water & Effluent Treatment Specialists
      </Text>
    </Page>
  </Document>
);