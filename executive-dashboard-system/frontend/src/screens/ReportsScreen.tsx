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
import { fetchEmployeeProductivity } from '../services/api';

export default function ReportsScreen() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadData = async () => {
    try {
      const response = await fetchEmployeeProductivity();
      if (response.success) {
        setData(response.data);
      } else {
        Alert.alert('Error', 'Failed to load reports data');
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
        <Text>Loading reports...</Text>
      </View>
    );
  }

  if (!data) {
    return (
      <View style={styles.centered}>
        <Text>No reports data available</Text>
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
          <Title>👥 Employee Performance</Title>
          {data.employee_performance?.map((employee: any, index: number) => (
            <View key={index} style={styles.employeeItem}>
              <Paragraph style={styles.employeeName}>{employee.name}</Paragraph>
              <Paragraph>Position: {employee.position}</Paragraph>
              <Paragraph>Transactions: {employee.transactions_count}</Paragraph>
              <Paragraph>Sales: Tsh {employee.total_sales?.toLocaleString()}</Paragraph>
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
  employeeItem: {
    marginBottom: 12,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  employeeName: {
    fontWeight: 'bold',
    fontSize: 16,
  },
}); 