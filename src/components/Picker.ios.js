import React, { Component } from 'react';
import {
  StyleSheet,
  View,
  Text,
  Picker as RCTPicker,
  Modal,
  TouchableOpacity,
  TouchableWithoutFeedback,
} from 'react-native';
import appStyle from '../appStyle';
import Icon from './Icon';

export default class Picker extends Component {
  props: PropsType;
  state: StateType = { isPicking: false };

  onRequestClose = () => this.setState({ isPicking: false });

  render() {
    const { children, selectedValueText, style, ...rest } = this.props;
    return (
      <View>
        {selectedValueText &&
          <TouchableOpacity style={styles.selectedValueContainer} onPress={() => this.setState({ isPicking: true })}>
            <Text style={styles.selectedValueStyle} numberOfLines={1}>
              {selectedValueText}
            </Text>
            <View style={styles.selectedValueChevron}>
              <Icon type="material" name="arrow-drop-down" color="grey" size={25} />
            </View>
          </TouchableOpacity>}
        <Modal animationType="slide" transparent visible={this.state.isPicking} onRequestClose={this.onRequestClose}>
          <TouchableWithoutFeedback onPress={this.onRequestClose}>
            <View style={styles.pickerModalBackground} />
          </TouchableWithoutFeedback>
          <View style={[styles.pickerContainer, style]}>
            {this.props.prompt &&
              <Text style={styles.prompt}>
                {this.props.prompt}
              </Text>}
            <RCTPicker itemStyle={{ fontSize: 16 }} {...rest}>
              {children}
            </RCTPicker>
          </View>
        </Modal>
      </View>
    );
  }
}

type PropsType = {
  visible: boolean,
  onFinishPicking: Function,
};

type StateType = {
  isPicking: boolean,
};

const styles = StyleSheet.create({
  selectedValueContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: 'white',
    borderWidth: 1,
    borderRadius: 4,
    borderColor: 'grey',
    elevation: 1,
    paddingLeft: 10,
    paddingRight: 20,
    paddingVertical: 15,
  },
  selectedValueStyle: {
    color: appStyle.colors.primary,
    paddingRight: 10,
  },
  selectedValueChevron: {
    position: 'absolute',
    right: 10,
  },
  prompt: {
    marginTop: 10,
    textAlign: 'center',
    fontSize: 16,
    fontWeight: 'bold',
  },
  pickerModalBackground: {
    flex: 1,
  },
  pickerContainer: {
    backgroundColor: 'white',
    opacity: 1,
    paddingHorizontal: 20,
  },
});
