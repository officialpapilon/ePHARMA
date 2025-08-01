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
import { fetchDashboardData } from '../services/api';

interface DashboardData {
  revenue: {
    current_month: number;
    previous_month: number;
    growth_percentage: number;
  };
  transactions: {
    current_month: number;
    previous_month: number;
    growth_percentage: number;
  };
  inventory: {
    total_products: number;
    low_stock: number;
    out_of_stock: number;
    stock_health_percentage: number;
  };
  branches: {
    active: number;
    total: number;
    active_percentage: number;
  };
}

export default function DashboardScreen() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadData = async () => {
    try {
      const response = await fetchDashboardData();
      if (response.success) {
        setData(response.data);
      } else {
        Alert.alert('Error', 'Failed to load dashboard data');
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
        <Text>Loading dashboard...</Text>
      </View>
    );
  }

  if (!data) {
    return (
      <View style={styles.centered}>
        <Text>No data available</Text>
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
          <Title>💰 Revenue</Title>
          <Paragraph>Current Month: Tsh {data.revenue.current_month.toLocaleString()}</Paragraph>
          <Paragraph>Previous Month: Tsh {data.revenue.previous_month.toLocaleString()}</Paragraph>
          <Paragraph style={data.revenue.growth_percentage >= 0 ? styles.positive : styles.negative}>
            Growth: {data.revenue.growth_percentage}%
          </Paragraph>
        </Card.Content>
      </Card>

      <Card style={styles.card}>
        <Card.Content>
          <Title>📊 Transactions</Title>
          <Paragraph>Current Month: {data.transactions.current_month}</Paragraph>
          <Paragraph>Previous Month: {data.transactions.previous_month}</Paragraph>
          <Paragraph style={data.transactions.growth_percentage >= 0 ? styles.positive : styles.negative}>
            Growth: {data.transactions.growth_percentage}%
          </Paragraph>
        </Card.Content>
      </Card>

      <Card style={styles.card}>
        <Card.Content>
          <Title>📦 Inventory</Title>
          <Paragraph>Total Products: {data.inventory.total_products}</Paragraph>
          <Paragraph>Low Stock: {data.inventory.low_stock}</Paragraph>
          <Paragraph>Out of Stock: {data.inventory.out_of_stock}</Paragraph>
          <Paragraph>Health: {data.inventory.stock_health_percentage}%</Paragraph>
        </Card.Content>
      </Card>

      <Card style={styles.card}>
        <Card.Content>
          <Title>🏢 Branches</Title>
          <Paragraph>Active: {data.branches.active}</Paragraph>
          <Paragraph>Total: {data.branches.total}</Paragraph>
          <Paragraph>Health: {data.branches.active_percentage}%</Paragraph>
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
  positive: {
    color: '#28a745',
    fontWeight: 'bold',
  },
  negative: {
    color: '#dc3545',
    fontWeight: 'bold',
  },
}); 