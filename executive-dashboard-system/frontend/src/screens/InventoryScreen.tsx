import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  Alert,
} from 'react-native';
import { Card, Title, Paragraph } from 'react-native-paper';
import { fetchInventoryStatus } from '../services/api';

export default function InventoryScreen() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadData = async () => {
    try {
      const response = await fetchInventoryStatus();
      if (response.success) {
        setData(response.data);
      } else {
        Alert.alert('Error', 'Failed to load inventory data');
      }
    } catch (error) {
      Alert.alert('Error', 'Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  useEffect(() => {
    loadData();
  }, []);

  if (loading) {
    return (
      <View style={styles.centered}>
        <Text>Loading inventory data...</Text>
      </View>
    );
  }

  if (!data) {
    return (
      <View style={styles.centered}>
        <Text>No inventory data available</Text>
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
    >
      <Card style={styles.card}>
        <Card.Content>
          <Title>📦 Overall Status</Title>
          <Paragraph>Total Products: {data.overall_status?.total_products}</Paragraph>
          <Paragraph style={styles.warning}>Low Stock: {data.overall_status?.low_stock}</Paragraph>
          <Paragraph style={styles.danger}>Out of Stock: {data.overall_status?.out_of_stock}</Paragraph>
          <Paragraph>Expiring Soon: {data.overall_status?.expiring_soon}</Paragraph>
        </Card.Content>
      </Card>

      <Card style={styles.card}>
        <Card.Content>
          <Title>🏆 Top Selling Products</Title>
          {data.top_selling_products?.map((product: any, index: number) => (
            <View key={index} style={styles.productItem}>
              <Paragraph style={styles.productName}>{product.product_name}</Paragraph>
              <Paragraph>Sales: {product.sales_count}</Paragraph>
              <Paragraph>Revenue: Tsh {product.total_revenue?.toLocaleString()}</Paragraph>
            </View>
          ))}
        </Card.Content>
      </Card>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
    padding: 16,
  },
  card: {
    marginBottom: 16,
    elevation: 4,
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  warning: {
    color: '#ffc107',
    fontWeight: 'bold',
  },
  danger: {
    color: '#dc3545',
    fontWeight: 'bold',
  },
  productItem: {
    marginBottom: 8,
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  productName: {
    fontWeight: 'bold',
  },
}); 