Feature: Blackjack

  Scenario: Blackjack board renders correctly
    Given I have a seeded authenticated session
    When I open the blackjack board
    Then I see the blackjack table
    And I see the blackjack controls

  Scenario: Dealing a blackjack round shows cards on the table
    Given I have a seeded authenticated session
    And I open the blackjack board
    When I deal a blackjack round
    Then I see blackjack cards on the table

  Scenario: Switching from blackjack title picker back to memory
    Given I have a seeded authenticated session
    And I open the blackjack board
    When I open the blackjack game picker
    And I choose memory from the blackjack picker
    Then I see the memory board
