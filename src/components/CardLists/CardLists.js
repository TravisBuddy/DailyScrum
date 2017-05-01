// @flow
import React, { Component } from 'react';
import { StyleSheet, View, SectionList, Text } from 'react-native';
import { TrelloCard } from 'DailyScrum/src/components';
import type { CardListsType } from 'DailyScrum/src/modules/cards/reducer';
import type { CardType } from '../../types';
import { FilterMembers, ListHeader } from './';

class CardsList extends Component {
  props: PropsType;
  state: StateType = {
    cards: [],
    filteredMember: null,
    isRefreshing: false,
  };

  // TODO identify unchecked checklists
  // TODO extract and show post estimated points
  // TODO show labels
  // TODO on click show attachments
  // TODO on click show description

  componentDidMount() {
    this.configure(this.props);
  }

  componentWillReceiveProps(nextProps: PropsType) {
    if (nextProps.cardLists !== this.props.cardLists) {
      this.configure(nextProps);
    }
  }

  configure = (props: PropsType) => {
    let cards = [];
    // $FlowFixMe https://github.com/facebook/flow/issues/2221
    Object.values(props.cardLists).forEach(list => list.forEach(card => cards.push(card)));

    this.setState({
      cards,
    });
  };

  handleRefresh = () => {
    this.setState({ isRefreshing: true }, () => {
      this.props.onRefresh().then(() =>
        this.setState({
          isRefreshing: false,
        })
      );
    });
  };

  filterMember = (memberId: string) => {
    this.setState({ filteredMember: this.state.filteredMember !== memberId ? memberId : null });
  };

  renderCard = ({ item }: { item: CardType }) => <TrelloCard card={item} />;
  renderSectionHeader = ({ section }: { section: { data: [], key: string } }) =>
    (section.data.length ? <ListHeader listKey={section.key} /> : null);

  render() {
    if (!this.state.cards.length)
      return <View style={this.props.style}><Text style={styles.noCardsText}>No cards yet</Text></View>;

    const { cardLists } = this.props;
    // $FlowFixMe https://github.com/facebook/flow/issues/2221
    const sections = Object.entries(cardLists).map(([listKey, listCards]: [string, CardType[]]) => ({
      key: listKey,
      data: listCards.filter(
        card => (this.state.filteredMember ? card.idMembers.includes(this.state.filteredMember) : true)
      ),
    }));

    return (
      <View style={[styles.container, this.props.style]}>
        <View>
          <FilterMembers
            style={styles.filterContainer}
            cards={this.state.cards}
            filtered={this.state.filteredMember}
            onFilter={this.filterMember}
          />
        </View>
        <View style={{ flex: 1 }}>
          <SectionList
            contentContainerStyle={styles.listsContainer}
            showsVerticalScrollIndicator={false}
            refreshing={this.state.isRefreshing}
            onRefresh={this.handleRefresh}
            SectionSeparatorComponent={() => <View style={styles.listSeparator} />}
            renderSectionHeader={this.renderSectionHeader}
            renderItem={this.renderCard}
            keyExtractor={(card: CardType) => card.idShort}
            sections={sections}
          />
        </View>
      </View>
    );
  }
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
  },
  noCardsText: {
    textAlign: 'center',
  },
  filterContainer: {
    flexGrow: 1,
    justifyContent: 'space-around',
    paddingBottom: 10,
  },
  listsContainer: {
    paddingVertical: 10,
  },
  listName: {
    marginBottom: 5,
  },
  listSeparator: {
    marginTop: 20,
  },
});

type StateType = {
  isRefreshing: boolean,
  filteredMember: ?string,
  cards: CardType[],
};

type PropsType = {
  style?: any,
  cardLists: CardListsType,
  onRefresh: Function,
};

export default CardsList;