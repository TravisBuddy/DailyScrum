// @flow
import React from 'react';
import { View, StyleSheet, Text } from 'react-native';
import * as Animatable from 'react-native-animatable';
import { Card, Icon } from 'DailyScrum/src/components';
import appStyle from 'DailyScrum/src/appStyle';

export default (props: PropsType) =>
  <Card>
    <View style={styles.container}>
      <Animatable.View animation="pulse" iterationCount="infinite" style={styles.iconContainer}>
        <Icon name="star" size={30} color="#e6c60d" />
      </Animatable.View>
      <Text style={styles.label}>Sprint Goal</Text>
    </View>
    <Text style={styles.title}>
      {props.title}
    </Text>
  </Card>;

type PropsType = {
  title: string,
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
  },
  iconContainer: {
    alignItems: 'center',
    marginTop: 10,
  },
  label: {
    color: appStyle.primaryDark,
    fontSize: 12,
    fontWeight: '300',
  },
  title: {
    fontSize: appStyle.font.size.big,
    fontWeight: 'bold',
    color: appStyle.colors.text,
    textAlign: 'center',
    marginTop: 18,
    marginBottom: 10,
  },
});
