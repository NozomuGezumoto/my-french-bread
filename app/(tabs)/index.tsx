import { View, StyleSheet } from 'react-native';
import BakeryMap from '../../src/components/BakeryMap';

export default function MapScreen() {
  return (
    <View style={styles.container}>
      <BakeryMap />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});
