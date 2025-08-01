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
import { fetchAlerts } from '../services/api';

export default function AlertsScreen() {
  const [alerts, setAlerts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadData = async () => {
    try {
      const response = await fetchAlerts();
      if (response.success) {
        setAlerts(response.data);
      } else {
        Alert.alert('Error', 'Failed to load alerts');
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

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical':
        return '#dc3545';
      case 'high':
        return '#fd7e14';
      case 'medium':
        return '#ffc107';
      case 'low':
        return '#28a745';
      default:
        return '#6c757d';
    }
  };

  if (loading) {
    return (
      <View style={styles.centered}>
        <Text>Loading alerts...</Text>
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
      {alerts.length === 0 ? (
        <Card style={styles.card}>
          <Card.Content>
            <Title>✅ No Alerts</Title>
            <Paragraph>All systems are running smoothly!</Paragraph>
          </Card.Content>
        </Card>
      ) : (
        alerts.map((alert, index) => (
          <Card key={index} style={styles.card}>
            <Card.Content>
              <Title style={{ color: getSeverityColor(alert.severity) }}>
                {alert.title}
              </Title>
              <Paragraph>{alert.message}</Paragraph>
              <Text style={styles.alertMeta}>
                Type: {alert.type} | Severity: {alert.severity}
              </Text>
            </Card.Content>
          </Card>
        ))
      )}
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
  alertMeta: {
    fontSize: 12,
    color: '#666',
    marginTop: 8,
  },
}); 