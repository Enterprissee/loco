export default {
  // Used to show whether or not an async call is being made
  fetching: false,

  // Control user access throughout the app
  loggedIn: false,

  // All fetched API data
  api: {
    
    // Ask API for routes to display
    routes: [],

    // Scraped service data from MTA
    service: []
  }
};