Feature: Memory overlays

  Scenario: Opening the options menu from the memory board
    Given I have a seeded authenticated session
    And I open the memory board
    When I open the memory options menu
    Then I see the memory options menu

  Scenario: Opening the leaderboard dialog from the memory board
    Given I have a seeded authenticated session
    And I open the memory board
    When I open the leaderboard dialog
    Then I see the leaderboard dialog
