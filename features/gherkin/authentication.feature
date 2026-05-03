Feature: Authentication

  Scenario: Login screen shows the available access methods
    Given I am on the login page
    Then I see the login actions

  Scenario: Seeded session opens the memory board
    Given I have a seeded authenticated session
    When I open the memory board
    Then I see the memory board
