// src/data/testcases.js
// Generated from public/sample-testcases.jsonc
const testCases = [
  {
    "id": "TC_001",
    "name": "Verify user login with valid credentials",
    "description": "Verify that a returning customer can successfully log in using valid credentials.",
    "steps": [
      "Navigate to the OpenCart login page.",
      "Enter valid email address in the E-Mail Address field.",
      "Enter valid password in the Password field.",
      "Click on the Login button."
    ],
    "expectedResult": "User should be successfully logged in and redirected to the My Account page.",
    "status": "Not Run",
    "automationStatus": "Automated",
    "automationPath": "tests/TestOpenCart/test_user_login.py",
    "lastExecuted": "",
    "applicableVersions": ["v1.0", "v1.1", "v2.0"], // Core functionality
    "executedBy": "Pytest",
    "tags": [
      "Authentication",
      "Login",
      "Account"
    ],
    "priority": "High",
    "estimatedDuration": 1,
    "requirementIds": [
      "REQ-001"
    ]
  },
  {
    "id": "TC_002",
    "name": "Verify user login with invalid credentials",
    "description": "Verify that a user cannot log in using invalid credentials and appropriate error message is displayed.",
    "steps": [
      "Navigate to the OpenCart login page.",
      "Enter invalid email address in the E-Mail Address field.",
      "Enter invalid password in the Password field.",
      "Click on the Login button."
    ],
    "expectedResult": "User should not be logged in and an appropriate error message should be displayed.",
    "status": "Not Run",
    "automationStatus": "Automated",
    "automationPath": "tests/TestOpenCart/test_user_login_invalid.py",
    "lastExecuted": "",
    "applicableVersions": ["v1.0", "v1.1", "v2.0"], // Core functionality
    "executedBy": "Pytest",
    "tags": [
      "Authentication",
      "Login",
      "Negative Testing"
    ],
    "priority": "High",
    "estimatedDuration": 1,
    "requirementIds": [
      "REQ-001"
    ]
  },
  {
    "id": "TC_003",
    "name": "Login and Continue from Last Activity",
    "description": "Verify that after a user logs in, logs out, and clicks the Continue button, they are redirected back to the homepage.",
    "steps": [
      "Clear browser cache and navigate to the OpenCart homepage.",
      "Click on the My Account dropdown and select the Login option.",
      "Enter valid email and password, then click the Login button.",
      "Verify that the user's account dashboard is successfully loaded.",
      "Click on the My Account dropdown again and select Logout.",
      "Verify that the logout success page appears with a Continue button.",
      "Click the Continue button.",
      "Verify that the user is redirected back to the homepage."
    ],
    "expectedResult": "User should be redirected to the homepage after clicking the Continue button on the logout success page.",
    "status": "Not Run",
    "automationStatus": "Automated",
    "automationPath": "tests/TestOpenCart/test_login_logout_continue.py",
    "lastExecuted": "",
    "applicableVersions": ["v1.0", "v1.1", "v2.0"], // Core functionality
    "executedBy": "Pytest",
    "tags": [
      "Authentication",
      "Login",
      "Logout",
      "Navigation",
      "User Flow"
    ],
    "priority": "Medium",
    "estimatedDuration": 2,
    "requirementIds": [
      "REQ-001"
    ]
  },
  {
    "id": "TC_004",
    "name": "Verify 'Forgotten Password' functionality",
    "description": "Verify that a user can access and use the 'Forgotten Password' functionality.",
    "steps": [
      "Navigate to the OpenCart login page.",
      "Click on the 'Forgotten Password' link below the password field.",
      "Enter registered email address in the E-Mail Address field.",
      "Click on the Continue button."
    ],
    "expectedResult": "Password reset email should be sent to the registered email address and a confirmation message should be displayed.",
    "status": "Not Run",
    "automationStatus": "Automated",
    "automationPath": "tests/TestOpenCart/test_forgotten_password.py",
    "lastExecuted": "",
    "applicableVersions": ["v1.0", "v1.1", "v2.0"], // Core functionality
    "executedBy": "Pytest",
    "tags": [
      "Authentication",
      "Password Reset",
      "Account"
    ],
    "priority": "Medium",
    "estimatedDuration": 1,
    "requirementIds": [
      "REQ-001"
    ]
  },
  {
    "id": "TC_005",
    "name": "Verify new customer registration flow",
    "description": "Verify that a new customer can successfully register by completing the registration form.",
    "steps": [
      "Navigate to the OpenCart login page.",
      "Click on Continue button in the New Customer section.",
      "Enter First Name, Last Name, E-Mail, and Password in the registration form.",
      "Toggle the Newsletter subscription switch (optional).",
      "Check the 'I have read and agree to the Privacy Policy' checkbox.",
      "Click on the Continue button."
    ],
    "expectedResult": "User account should be created successfully and user should be redirected to account creation success page.",
    "status": "Not Run",
    "automationStatus": "Automated",
    "automationPath": "tests/TestOpenCart/test_user_registration.py",
    "lastExecuted": "",
    "applicableVersions": ["v1.0", "v1.1", "v2.0"], // Core functionality
    "executedBy": "Pytest",
    "tags": [
      "Authentication",
      "Registration",
      "Account"
    ],
    "priority": "High",
    "estimatedDuration": 2,
    "requirementIds": [
      "REQ-001"
    ]
  },
  {
    "id": "TC_006",
    "name": "Verify registration with existing email",
    "description": "Verify that system prevents registration with an already existing email address.",
    "steps": [
      "Navigate to the OpenCart registration page.",
      "Enter an email address that is already registered in the E-Mail field.",
      "Complete all other required fields (First Name, Last Name, Password).",
      "Check the Privacy Policy agreement checkbox.",
      "Click on the Continue button."
    ],
    "expectedResult": "Registration should be blocked and appropriate error message about duplicate email should be displayed.",
    "status": "Not Run",
    "automationStatus": "Automated",
    "automationPath": "tests/TestOpenCart/test_user_registration_duplicate_email.py",
    "lastExecuted": "",
    "applicableVersions": ["v1.0", "v1.1", "v2.0"], // Core functionality
    "executedBy": "Pytest",
    "tags": [
      "Authentication",
      "Registration",
      "Negative Testing"
    ],
    "priority": "Medium",
    "estimatedDuration": 1,
    "requirementIds": [
      "REQ-001"
    ]
  },
  {
    "id": "TC_007",
    "name": "Verify registration without agreeing to Privacy Policy",
    "description": "Verify that system prevents registration when Privacy Policy checkbox is not checked.",
    "steps": [
      "Navigate to the OpenCart registration page.",
      "Enter valid data for all required fields (First Name, Last Name, E-Mail, Password).",
      "Do NOT check the 'I have read and agree to the Privacy Policy' checkbox.",
      "Click on the Continue button."
    ],
    "expectedResult": "Registration should not proceed and an appropriate error message about Privacy Policy agreement should be displayed.",
    "status": "Not Run",
    "automationStatus": "Automated",
    "automationPath": "tests/TestOpenCart/test_privacy_policy_validation.py",
    "lastExecuted": "",
    "applicableVersions": ["v1.0", "v1.1", "v2.0"], // Core functionality
    "executedBy": "Pytest",
    "tags": [
      "Authentication",
      "Registration",
      "Privacy Policy",
      "Negative Testing"
    ],
    "priority": "Medium",
    "estimatedDuration": 1,
    "requirementIds": [
      "REQ-001"
    ]
  },
  {
    "id": "TC_008",
    "name": "Verify registration with missing required fields",
    "description": "Verify that system validates required fields during registration.",
    "steps": [
      "Navigate to the OpenCart registration page.",
      "Leave one or more required fields empty (First Name, Last Name, E-Mail, Password).",
      "Check the Privacy Policy agreement checkbox.",
      "Click on the Continue button."
    ],
    "expectedResult": "Registration should not proceed and appropriate error messages should be displayed for each missing required field.",
    "status": "Not Run",
    "automationStatus": "Automated",
    "automationPath": "tests/TestOpenCart/test_required_fields_validation.py",
    "lastExecuted": "",
    "applicableVersions": ["v1.0", "v1.1", "v2.0"], // Core functionality
    "executedBy": "Pytest",
    "tags": [
      "Authentication",
      "Registration",
      "Validation",
      "Negative Testing"
    ],
    "priority": "High",
    "estimatedDuration": 1,
    "requirementIds": [
      "REQ-001"
    ]
  },
  {
    "id": "TC_009",
    "name": "Verify Top Bar Elements Are Visible on the Homepage",
    "description": "Verify that all top bar elements including currency switcher, contact info, account options, wishlist, cart, and checkout are visible on the homepage.",
    "steps": [
      "1. Navigate to the homepage",
      "2. Locate the top bar section",
      "3. Verify currency switcher is visible",
      "4. Verify contact info is displayed",
      "5. Verify account options are visible",
      "6. Verify wishlist icon is present",
      "7. Verify cart icon is displayed",
      "8. Verify checkout link is visible"
    ],
    "expectedResult": "All top bar elements (currency switcher, contact info, account options, wishlist, cart, and checkout) should be visible and properly displayed on the homepage.",
    "status": "Not Run",
    "automationStatus": "Automated",
    "automationPath": "tests/TestOpenCart/test_dashboard_content.py",
    "lastExecuted": "",
    "applicableVersions": ["v1.0", "v1.1", "v2.0"], // Core UI
    "executedBy": "Pytest",
    "tags": [
      "Dashboard",
      "Homepage",
      "UI Elements",
      "Top Bar"
    ],
    "priority": "High",
    "estimatedDuration": 2,
    "requirementIds": [
      "REQ-002"
    ]
  },
  {
    "id": "TC_010",
    "name": "Verify Header Contains Logo, Search Bar, Navigation Menu, and Cart Summary",
    "description": "Verify that the header section contains all required elements including logo, search bar, navigation menu, and cart summary.",
    "steps": [
      "1. Navigate to the homepage",
      "2. Locate the header section",
      "3. Verify company logo is displayed",
      "4. Verify search bar is present and functional",
      "5. Verify navigation menu is visible",
      "6. Verify cart summary is displayed"
    ],
    "expectedResult": "Header should contain logo, search bar, navigation menu, and cart summary, all properly displayed and accessible.",
    "status": "Not Run",
    "automationStatus": "Automated",
    "automationPath": "tests/TestOpenCart/test_dashboard_header.py",
    "lastExecuted": "",
    "applicableVersions": ["v1.0", "v1.1", "v2.0"], // Core UI
    "executedBy": "Pytest",
    "tags": [
      "Dashboard",
      "Homepage",
      "Header",
      "UI Elements"
    ],
    "priority": "High",
    "estimatedDuration": 2,
    "requirementIds": [
      "REQ-002"
    ]
  },
  {
    "id": "TC_011",
    "name": "Verify Main Navigation Bar Is Displayed Below the Header",
    "description": "Verify that the main navigation bar is properly positioned below the header section.",
    "steps": [
      "1. Navigate to the homepage",
      "2. Locate the header section",
      "3. Locate the main navigation bar",
      "4. Verify navigation bar is positioned below the header",
      "5. Verify navigation bar is clearly visible and accessible"
    ],
    "expectedResult": "Main navigation bar should be displayed below the header section and be clearly visible to users.",
    "status": "Not Run",
    "automationStatus": "Automated",
    "automationPath": "tests/TestOpenCart/test_navigation_layout.py",
    "lastExecuted": "",
    "applicableVersions": ["v1.0", "v1.1", "v2.0"], // Core UI
    "executedBy": "Pytest",
    "tags": [
      "Dashboard",
      "Homepage",
      "Navigation",
      "Layout"
    ],
    "priority": "Medium",
    "estimatedDuration": 1,
    "requirementIds": [
      "REQ-002"
    ]
  },
  {
    "id": "TC_012",
    "name": "Verify Each Main Category Is Displayed in the Navigation Bar",
    "description": "Verify that all main product categories (Desktops, Laptops, Tablets, etc.) are displayed in the navigation bar.",
    "steps": [
      "1. Navigate to the homepage",
      "2. Locate the main navigation bar",
      "3. Verify 'Desktops' category is displayed",
      "4. Verify 'Laptops' category is displayed",
      "5. Verify 'Tablets' category is displayed",
      "6. Verify all other main categories are visible"
    ],
    "expectedResult": "All main categories including Desktops, Laptops, Tablets, and other categories should be displayed in the navigation bar.",
    "status": "Not Run",
    "automationStatus": "Automated",
    "automationPath": "tests/TestOpenCart/test_navigation_categories.py",
    "lastExecuted": "",
    "applicableVersions": ["v1.0", "v1.1", "v2.0"], // Core UI
    "executedBy": "Pytest",
    "tags": [
      "Dashboard",
      "Navigation",
      "Categories",
      "Menu"
    ],
    "priority": "High",
    "estimatedDuration": 2,
    "requirementIds": [
      "REQ-002"
    ]
  },
  {
    "id": "TC_013",
    "name": "Verify Product Cards Are Displayed in the Featured Section with Correct Info",
    "description": "Verify that product cards are properly displayed in the featured section with all required information.",
    "steps": [
      "1. Navigate to the homepage",
      "2. Locate the featured products section",
      "3. Verify product cards are displayed",
      "4. Verify each card shows product information",
      "5. Verify product details are accurate and complete"
    ],
    "expectedResult": "Product cards should be displayed in the featured section with correct and complete product information.",
    "status": "Not Run",
    "automationStatus": "Automated",
    "automationPath": "tests/TestOpenCart/test_product_cards.py",
    "lastExecuted": "",
    "applicableVersions": ["v1.0", "v1.1", "v2.0"], // Core UI
    "executedBy": "Pytest",
    "tags": [
      "Dashboard",
      "Products",
      "Featured Section",
      "Product Cards"
    ],
    "priority": "High",
    "estimatedDuration": 3,
    "requirementIds": [
      "REQ-002"
    ]
  },
  {
    "id": "TC_014",
    "name": "Verify Product Images, Titles, Prices, and Action Buttons Are Visible on Product Cards",
    "description": "Verify that all essential elements (images, titles, prices, and action buttons) are visible on product cards.",
    "steps": [
      "1. Navigate to the homepage",
      "2. Locate product cards in the featured section",
      "3. Verify product images are displayed clearly",
      "4. Verify product titles are visible and readable",
      "5. Verify product prices are displayed",
      "6. Verify action buttons (Add to Cart, Wishlist, etc.) are visible"
    ],
    "expectedResult": "All product cards should display images, titles, prices, and action buttons clearly and be easily accessible to users.",
    "status": "Not Run",
    "automationStatus": "Automated",
    "automationPath": "tests/TestOpenCart/test_product_card_elements.py",
    "lastExecuted": "",
    "applicableVersions": ["v1.0", "v1.1", "v2.0"], // Core UI
    "executedBy": "Pytest",
    "tags": [
      "Dashboard",
      "Products",
      "Product Cards",
      "UI Elements"
    ],
    "priority": "High",
    "estimatedDuration": 3,
    "requirementIds": [
      "REQ-002"
    ]
  },
  {
    "id": "TC_015",
    "name": "Verify Brand/Partner Logos Section Is Displayed Below Product Listings",
    "description": "Verify that the brand/partner logos section is properly displayed below the product listings.",
    "steps": [
      "1. Navigate to the homepage",
      "2. Scroll to the product listings section",
      "3. Locate the area below product listings",
      "4. Verify brand/partner logos section is displayed",
      "5. Verify logos are properly formatted and visible"
    ],
    "expectedResult": "Brand/partner logos section should be displayed below product listings with logos properly formatted and visible.",
    "status": "Not Run",
    "automationStatus": "Automated",
    "automationPath": "tests/TestOpenCart/test_brand_logos.py",
    "lastExecuted": "",
    "applicableVersions": ["v1.0", "v1.1", "v2.0"], // Core UI
    "executedBy": "Pytest",
    "tags": [
      "Dashboard",
      "Branding",
      "Partners",
      "Layout"
    ],
    "priority": "Medium",
    "estimatedDuration": 2,
    "requirementIds": [
      "REQ-002"
    ]
  },
  {
    "id": "TC_016",
    "name": "Verify Footer Section Is Displayed at the Bottom of the Homepage",
    "description": "Verify that the footer section is properly displayed at the bottom of the homepage.",
    "steps": [
      "1. Navigate to the homepage",
      "2. Scroll to the bottom of the page",
      "3. Verify footer section is displayed",
      "4. Verify footer contains appropriate links and information",
      "5. Verify footer formatting and layout are correct"
    ],
    "expectedResult": "Footer section should be displayed at the bottom of the homepage with proper formatting and all required information.",
    "status": "Not Run",
    "automationStatus": "Automated",
    "automationPath": "tests/TestOpenCart/test_footer.py",
    "lastExecuted": "",
    "applicableVersions": ["v1.0", "v1.1", "v2.0"], // Core UI
    "executedBy": "Pytest",
    "tags": [
      "Dashboard",
      "Footer",
      "Layout",
      "Homepage"
    ],
    "priority": "Medium",
    "estimatedDuration": 2,
    "requirementIds": [
      "REQ-002"
    ]
  },
  {
    "id": "TC_017",
    "name": "Verify reachability and load success of each category page from the main navigation menu",
    "description": "Verify that each category page can be reached from the main navigation menu and loads successfully.",
    "steps": [
      "1. Navigate to the homepage",
      "2. Locate the main navigation menu",
      "3. Click on each category link one by one",
      "4. Verify each category page loads successfully",
      "5. Verify page content is displayed correctly",
      "6. Verify navigation back to homepage works"
    ],
    "expectedResult": "All category pages should be reachable from the main navigation menu and load successfully with proper content display.",
    "status": "Not Run",
    "automationStatus": "Automated",
    "automationPath": "tests/TestOpenCart/test_category_navigation.py",
    "lastExecuted": "",
    "applicableVersions": ["v1.0", "v1.1", "v2.0"], // Core functionality
    "executedBy": "Pytest",
    "tags": [
      "Navigation",
      "Categories",
      "Page Load",
      "Functionality"
    ],
    "priority": "High",
    "estimatedDuration": 5,
    "requirementIds": [
      "REQ-003"
    ]
  },
  {
    "id": "TC_018",
    "name": "Verify that users can add a product to the wishlist from a product card on the homepage",
    "description": "Verify that users can successfully add a product to their wishlist directly from a product card on the homepage.",
    "steps": [
      "1. Navigate to the homepage",
      "2. Locate a product card in the featured section",
      "3. Find the 'Add to Wishlist' button or icon",
      "4. Click on the 'Add to Wishlist' button",
      "5. Verify confirmation message or visual feedback",
      "6. Navigate to wishlist to confirm product was added"
    ],
    "expectedResult": "User should be able to add a product to wishlist from homepage product card, and the product should appear in the wishlist.",
    "status": "Not Run",
    "automationStatus": "Automated",
    "automationPath": "tests/TestOpenCart/test_wishlist_functionality.py",
    "lastExecuted": "",
    "applicableVersions": ["v1.0", "v1.1", "v2.0"], // Core functionality
    "executedBy": "Pytest",
    "tags": [
      "Wishlist",
      "Product Cards",
      "Homepage",
      "Functionality"
    ],
    "priority": "Medium",
    "estimatedDuration": 3,
    "requirementIds": [
      "REQ-003"
    ]
  },
  {
    "id": "TC_019",
    "name": "Verify that users can add a product to the cart directly from a product card on the homepage",
    "description": "Verify that users can successfully add a product to their cart directly from a product card on the homepage.",
    "steps": [
      "1. Navigate to the homepage",
      "2. Locate a product card in the featured section",
      "3. Find the 'Add to Cart' button",
      "4. Click on the 'Add to Cart' button",
      "5. Verify confirmation message or visual feedback",
      "6. Check cart summary to confirm product was added"
    ],
    "expectedResult": "User should be able to add a product to cart from homepage product card, and the product should appear in the cart with updated cart summary.",
    "status": "Not Run",
    "automationStatus": "Automated",
    "automationPath": "tests/TestOpenCart/test_cart_functionality.py",
    "lastExecuted": "",
    "applicableVersions": ["v1.0", "v1.1", "v2.0"], // Core functionality
    "executedBy": "Pytest",
    "tags": [
      "Shopping Cart",
      "Product Cards",
      "Homepage",
      "Functionality"
    ],
    "priority": "High",
    "estimatedDuration": 3,
    "requirementIds": [
      "REQ-003"
    ]
  },
  {
    "id": "TC_020",
    "name": "Verify that clicking the cart icon/button on the homepage correctly opens the cart summary page",
    "description": "Verify that clicking the cart icon or button on the homepage successfully opens the cart summary page.",
    "steps": [
      "1. Navigate to the homepage",
      "2. Locate the cart icon/button in the header or top bar",
      "3. Click on the cart icon/button",
      "4. Verify cart summary page opens",
      "5. Verify cart contents are displayed correctly",
      "6. Verify page loads completely without errors"
    ],
    "expectedResult": "Clicking the cart icon/button should open the cart summary page displaying current cart contents and functionalities.",
    "status": "Not Run",
    "automationStatus": "Automated",
    "automationPath": "tests/TestOpenCart/test_cart_navigation.py",
    "lastExecuted": "",
    "applicableVersions": ["v1.0", "v1.1", "v2.0"], // Core functionality
    "executedBy": "Pytest",
    "tags": [
      "Shopping Cart",
      "Navigation",
      "Homepage",
      "Cart Summary"
    ],
    "priority": "High",
    "estimatedDuration": 2,
    "requirementIds": [
      "REQ-003"
    ]
  },
  {
    "id": "TC_021",
    "name": "Verify that users can use the Compare this Product button from a product card on the homepage",
    "description": "Verify that users can successfully use the 'Compare this Product' button from a product card on the homepage.",
    "steps": [
      "1. Navigate to the homepage",
      "2. Locate a product card in the featured section",
      "3. Find the 'Compare this Product' button",
      "4. Click on the 'Compare this Product' button",
      "5. Verify confirmation message or visual feedback",
      "6. Navigate to product comparison page to verify product was added"
    ],
    "expectedResult": "User should be able to add a product to comparison from homepage product card, and the product should be available for comparison.",
    "status": "Not Run",
    "automationStatus": "Automated",
    "automationPath": "tests/TestOpenCart/test_product_comparison.py",
    "lastExecuted": "",
    "applicableVersions": ["v1.0", "v1.1", "v2.0"], // Core functionality
    "executedBy": "Pytest",
    "tags": [
      "Product Comparison",
      "Product Cards",
      "Homepage",
      "Functionality"
    ],
    "priority": "Medium",
    "estimatedDuration": 3,
    "requirementIds": [
      "REQ-003"
    ]
  },
  {
    "id": "TC_022",
    "name": "Verify Scroll Functionality Works on the Homepage",
    "description": "Verify that the scroll functionality works properly on the homepage for both mouse and keyboard navigation.",
    "steps": [
      "1. Navigate to the homepage",
      "2. Test mouse scroll wheel functionality",
      "3. Test scrollbar drag functionality",
      "4. Test keyboard scroll (Page Up/Down, Arrow keys)",
      "5. Test scroll to top functionality",
      "6. Verify smooth scrolling behavior"
    ],
    "expectedResult": "All scroll functionalities should work properly, allowing users to navigate through the homepage content smoothly.",
    "status": "Not Run",
    "automationStatus": "Automated",
    "automationPath": "tests/TestOpenCart/test_scroll_functionality.py",
    "lastExecuted": "",
    "applicableVersions": [], // Universal test
    "executedBy": "Pytest",
    "tags": [
      "Scroll",
      "Navigation",
      "Homepage",
      "User Experience"
    ],
    "priority": "Medium",
    "estimatedDuration": 2,
    "requirementIds": [
      "REQ-003"
    ]
  },
  {
    "id": "TC_023",
    "name": "Verify Currency Switcher Dropdown Opens and Allows Currency Selection",
    "description": "Verify that the currency switcher dropdown opens correctly and allows users to select different currencies.",
    "steps": [
      "1. Navigate to the homepage",
      "2. Locate the currency switcher in the top bar",
      "3. Click on the currency switcher dropdown",
      "4. Verify dropdown opens with available currency options",
      "5. Select a different currency from the dropdown",
      "6. Verify currency change is applied and prices are updated"
    ],
    "expectedResult": "Currency switcher dropdown should open, display available currencies, and successfully change the site currency when selected.",
    "status": "Not Run",
    "automationStatus": "Automated",
    "automationPath": "tests/TestOpenCart/test_currency_switcher.py",
    "lastExecuted": "",
    "applicableVersions": ["v1.0", "v1.1", "v2.0"], // Core functionality
    "executedBy": "Pytest",
    "tags": [
      "Currency",
      "Dropdown",
      "Functionality",
      "Top Bar"
    ],
    "priority": "Medium",
    "estimatedDuration": 3,
    "requirementIds": [
      "REQ-003"
    ]
  },
  {
    "id": "TC_024",
    "name": "Verify My Account Dropdown Opens and Navigates to Account Page",
    "description": "Verify that the 'My Account' dropdown opens correctly and navigates to the appropriate account page.",
    "steps": [
      "1. Navigate to the homepage",
      "2. Locate the 'My Account' option in the top bar",
      "3. Click on the 'My Account' dropdown",
      "4. Verify dropdown opens with account options",
      "5. Select an account option (Login, Register, or My Account)",
      "6. Verify navigation to the correct account page"
    ],
    "expectedResult": "'My Account' dropdown should open, display account options, and navigate to the correct account page when selected.",
    "status": "Not Run",
    "automationStatus": "Automated",
    "automationPath": "tests/TestOpenCart/test_account_dropdown.py",
    "lastExecuted": "",
    "applicableVersions": ["v1.0", "v1.1", "v2.0"], // Core functionality
    "executedBy": "Pytest",
    "tags": [
      "Account",
      "Dropdown",
      "Navigation",
      "Top Bar"
    ],
    "priority": "High",
    "estimatedDuration": 3,
    "requirementIds": [
      "REQ-003"
    ]
  },
  {
    "id": "TC_025",
    "name": "Verify Wishlist Icon Redirects to Wishlist Page",
    "description": "Verify that clicking the wishlist icon successfully redirects users to the wishlist page.",
    "steps": [
      "1. Navigate to the homepage",
      "2. Locate the wishlist icon in the top bar",
      "3. Click on the wishlist icon",
      "4. Verify redirection to the wishlist page",
      "5. Verify wishlist page loads correctly",
      "6. Verify wishlist contents are displayed properly"
    ],
    "expectedResult": "Clicking the wishlist icon should redirect to the wishlist page, which should load correctly and display wishlist contents.",
    "status": "Not Run",
    "automationStatus": "Automated",
    "automationPath": "tests/TestOpenCart/test_wishlist_navigation.py",
    "lastExecuted": "",
    "applicableVersions": ["v1.0", "v1.1", "v2.0"], // Core functionality
    "executedBy": "Pytest",
    "tags": [
      "Wishlist",
      "Navigation",
      "Redirection",
      "Top Bar"
    ],
    "priority": "Medium",
    "estimatedDuration": 2,
    "requirementIds": [
      "REQ-003"
    ]
  },
  {
    "id": "TC_026",
    "name": "Verify Shopping Cart Icon Redirects to Cart Page",
    "description": "Verify that clicking the shopping cart icon successfully redirects users to the cart page.",
    "steps": [
      "1. Navigate to the homepage",
      "2. Locate the shopping cart icon in the top bar",
      "3. Click on the shopping cart icon",
      "4. Verify redirection to the cart page",
      "5. Verify cart page loads correctly",
      "6. Verify cart contents and functionality are displayed properly"
    ],
    "expectedResult": "Clicking the shopping cart icon should redirect to the cart page, which should load correctly and display cart contents and functionality.",
    "status": "Not Run",
    "automationStatus": "Automated",
    "automationPath": "tests/TestOpenCart/test_cart_icon_navigation.py",
    "lastExecuted": "",
    "applicableVersions": ["v1.0", "v1.1", "v2.0"], // Core functionality
    "executedBy": "Pytest",
    "tags": [
      "Shopping Cart",
      "Navigation",
      "Redirection",
      "Top Bar"
    ],
    "priority": "High",
    "estimatedDuration": 2,
    "requirementIds": [
      "REQ-003"
    ]
  },
  {
    "id": "TC_027",
    "name": "Verify Checkout Link Navigates to the Checkout Page",
    "description": "Verify that clicking the checkout link successfully navigates users to the checkout page.",
    "steps": [
      "1. Navigate to the homepage",
      "2. Locate the checkout link in the top bar",
      "3. Click on the checkout link",
      "4. Verify navigation to the checkout page",
      "5. Verify checkout page loads correctly",
      "6. Verify checkout form and process are accessible"
    ],
    "expectedResult": "Clicking the checkout link should navigate to the checkout page, which should load correctly and display the checkout process.",
    "status": "Not Run",
    "automationStatus": "Automated",
    "automationPath": "tests/TestOpenCart/test_checkout_navigation.py",
    "lastExecuted": "",
    "applicableVersions": ["v1.0", "v1.1", "v2.0"], // Core functionality
    "executedBy": "Pytest",
    "tags": [
      "Checkout",
      "Navigation",
      "Top Bar",
      "Purchase Process"
    ],
    "priority": "High",
    "estimatedDuration": 3,
    "requirementIds": [
      "REQ-003"
    ]
  }
];

export default testCases;
