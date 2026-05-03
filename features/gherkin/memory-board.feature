Feature: Memory board

  Scenario: Switching memory game from the selected title
    Given I have a seeded authenticated session
    And I open the memory board
    When I open the current memory game picker
    And I choose the memory game "Sinónimos"
    Then I see the selected memory game "Sinónimos"

  Scenario: Selected memory game persists after reload
    Given I have a seeded authenticated session
    And I open the memory board
    When I open the current memory game picker
    And I choose the memory game "Matemáticas"
    And I reload the page
    Then I see the selected memory game "Matemáticas"

  Scenario: Switching from memory to blackjack from the page header
    Given I have a seeded authenticated session
    And I open the memory board
    When I switch to blackjack from the page header
    Then I see the blackjack table
