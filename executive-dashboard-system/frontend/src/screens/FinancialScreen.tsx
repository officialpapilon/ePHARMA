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
import { fetchFinancialSummary } from '../services/api';

export default function FinancialScreen() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadData = async () => {
    try {
      const response = await fetchFinancialSummary();
      if (response.success) {
        setData(response.data);
      } else {
        Alert.alert('Error', 'Failed to load financial data');
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
        <Text>Loading financial data...</Text>
      </View>
    );
  }

  if (!data) {
    return (
      <View style={styles.centered}>
        <Text>No financial data available</Text>
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
          <Title>💰 Monthly Revenue</Title>
          <Paragraph>Tsh {data.monthly_revenue?.toLocaleString() || 'N/A'}</Paragraph>
        </Card.Content>
      </Card>

      <Card style={styles.card}>
        <Card.Content>
          <Title>💳 Payment Methods</Title>
          {data.revenue_by_payment_method?.map((method: any, index: number) => (
            <Paragraph key={index}>
              {method.payment_method}: Tsh {method.total?.toLocaleString()}
            </Paragraph>
          ))}
        </Card.Content>
      </Card>

      <Card style={styles.card}>
        <Card.Content>
          <Title>📈 Revenue Sources</Title>
          {data.revenue_by_source?.map((source: any, index: number) => (
            <Paragraph key={index}>
              {source.source}: Tsh {source.total?.toLocaleString()}
            </Paragraph>
          ))}
        </Card.Content>
      </Card>

      <Card style={styles.card}>
        <Card.Content>
          <Title>📊 Average Transaction</Title>
          <Paragraph>Tsh {data.average_transaction_value?.toLocaleString() || 'N/A'}</Paragraph>
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
}); 