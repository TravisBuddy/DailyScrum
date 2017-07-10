// @flow
import React, { Component } from 'react';
import { StyleSheet, TouchableOpacity } from 'react-native';
import codePush from 'react-native-code-push';
import { Page, Text } from 'DailyScrum/src/components';
import appStyle from '../../appStyle';

export default class About extends Component {
  state: StateType = {
    codePushInfo: null,
    codePushUpdateStatus: null,
  };
  static navigationOptions = {
    headerTitle: 'About',
  };

  componentDidMount() {
    codePush.getUpdateMetadata().then(update => {
      if (!update) return;
      let codePushInfo = update.label;
      if (update.description) {
        codePushInfo += ' (' + update.description + ')';
      }
      this.setState({
        codePushInfo,
      });
    });
  }

  updateWithCodePush = () => {
    codePush.sync(
      {
        updateDialog: {
          appendReleaseDescription: true,
          descriptionPrefix: '\n\nChangelog:\n',
        },
        installMode: codePush.InstallMode.IMMEDIATE,
      },
      SyncStatus => {
        switch (SyncStatus) {
          case codePush.SyncStatus.CHECKING_FOR_UPDATE:
            this.setState({ codePushUpdateStatus: 'Checking for update' });
            break;
          case codePush.SyncStatus.AWAITING_USER_ACTION:
            this.setState({ codePushUpdateStatus: 'Await action' });
            break;
          case codePush.SyncStatus.DOWNLOADING_PACKAGE:
            this.setState({ codePushUpdateStatus: 'Downloading' });
            break;
          case codePush.SyncStatus.INSTALLING_UPDATE:
            this.setState({ codePushUpdateStatus: 'Installing' });
            break;
          default:
            this.setState({ codePushUpdateStatus: 'No update found' });
        }
      }
    );
  };

  render() {
    return (
      <Page>
        {this.state.codePushInfo &&
          <Text style={[styles.text, styles.codePushInfo]}>
            {this.state.codePushInfo}
          </Text>}
        <TouchableOpacity onPress={this.updateWithCodePush}>
          <Text style={styles.text}>
            {this.state.codePushUpdateStatus || 'Check if there is an update'}
          </Text>
        </TouchableOpacity>
      </Page>
    );
  }
}

const styles = StyleSheet.create({
  text: {
    textAlign: 'center',
  },
  codePushInfo: {
    fontSize: appStyle.font.size.small,
  },
});

type StateType = {
  codePushInfo: ?string,
  codePushUpdateStatus: ?string,
};
