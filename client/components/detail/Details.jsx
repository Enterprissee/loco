import React from 'react';
import axios from 'axios';
import Schedule from './Schedule.jsx';
import StationList from './StationList.jsx';
import ComplaintList from './ComplaintList.jsx';
import Info from './Info.jsx';

export default class Details extends React.Component {
  constructor(props) {
    super(props);
    this.defaultComplaints = [
      { name: 'delayed', count: 0 },
      { name: 'closed', count: 0 },
      { name: 'accident', count: 0 },
      { name: 'crowded', count: 0 }
    ];
    this.state = {
      routeId: '',
      staticSched : false,
      direction : false,
      selected : false,
      uptownSched: [],
      downtownSched :[],
      stations : {},
      stopId : '',
      submissionStopId : '',
      // Default complaints
      complaints: this.defaultComplaints.map((el) => Object.assign({}, el)),
      info : []
    };
    this.handleChange = this.handleChange.bind(this);
    this.handleComplaintSubmit = this.handleComplaintSubmit.bind(this);
    this.handleDirectionSelection = this.handleDirectionSelection.bind(this);
  }

  componentDidMount() {
    // 1) The number of complaints : we have that endpoint
    // 2) when we incorporate a comments page, we'll need to display those too (priority TBD)
    let routeId = this.props.match.params.routeId === 'SIR' ? 'SI' : this.props.match.params.routeId
    axios.get('/api/route/stops', {
      params: {
        sub: 'mta',
        route_id: routeId
      }
    })
    .then(({ data }) => {
      this.setState({ routeId, stations: data })
    })
    .catch((error) => console.log(error));

    axios.get('/api/report/reports', {
      params : {
        sub : 'mta',
        route_id : routeId
      }
    })
    .then((data)=> {
      this.setState({info : data.data})
    })
  }

  handleChange(event) {
    let dayNumber = new Date().getDay();
    let dayTranslator = { 0: 'SUN', 6: 'SAT' }
    let day = dayTranslator[dayNumber] || 'WKD';
    let time = new Date().toLocaleDateString('en-gb');
    let value = event.target.value;
    let newState = {
      selected: true,
      stopId: value
    };
    axios.get('/api/times/stoproute', {
      params: {
        sub: 'mta',
        stop_id: value,
        route_id: this.state.routeId
      }
    })
    .then(({ data }) => {
      newState.uptownSched = data.filter((el) => el.arrival_time >= time && el.route_type === day).slice(0, 10);
      return axios.get('/api/times/stoproute', {
        params: {
          sub: 'mta',
          stop_id: value.replace(/N$/, 'S'),
          route_id: this.state.routeId
        }
      });
    })
    .then(({ data }) => {
      newState.downtownSched = data.filter((el) => el.arrival_time >= time && el.route_type === day).slice(0, 10);
      newState.staticSched = true;
      newState.direction = false;
      this.setState(newState);
    })
    .catch((error) => console.log(error));
  }

  handleDirectionSelection(event) {
    let value = event.target.value;
    let newState = { submissionStopId: value };
    axios.get('/api/report/stoproute', {
      params: {
        sub: 'mta',
        stop_id: value,
        route_id: this.state.routeId
      }
    })
    .then(({ data }) => {
      console.log('data from complaints request', data)
      let defaults = this.defaultComplaints.map((a) => Object.assign({}, a));
      let newComplaints = data.reduce((acc, b) => {
        let temp = acc.find((el) => el.name === b.name);
        temp ? temp.count = b.count : acc.push(b);
        return acc;
      }, defaults);
      newState.complaints = newComplaints;
      newState.direction = true;
      this.setState(newState);
    })
    .catch((error) => console.log(error));
  }

  handleComplaintSubmit(event) {
    let value = event.target.getAttribute('complaintname');
    axios.post('/api/report/add', {
      sub: 'mta',
      type: value,
      stop_id: this.state.submissionStopId,
      route_id: this.state.routeId
    })
    .then(({ data }) => {
      let complaints = this.state.complaints.slice();
      complaints.find((el) => el.name === value).count = data.count;
      this.setState({ complaints });
    })
    .catch((error) => console.log(error));
  }

  render() {
    return (
      <div>
        <div className="line-logo">Route: {this.state.routeId}</div>
        {
          this.state.info.map((element, idx) => <Info key={idx} report={element[0]} count={element[1]} stations={this.state.stations}/>)
        }
        <StationList stations={this.state.stations.N || []} handleChange={this.handleChange} />
        {this.state.staticSched ?
          <div>
            <Schedule schedType='Uptown' schedule={this.state.uptownSched} />
            <Schedule schedType='Downtown' schedule={this.state.downtownSched} />
          </div> : null}
        {this.state.selected ?
          <div>
            <h1>Complaints at This Station</h1>
            <select onChange={this.handleDirectionSelection}>
              <option>Select a direction</option>
              <option value={this.state.stopId}>Uptown</option>
              <option value={this.state.stopId.replace(/N$/, 'S')}>Downtown</option>
            </select>
          </div> : null}
        {this.state.direction ?
          <ComplaintList
            complaints={this.state.complaints}
            handleComplaintSubmit={this.handleComplaintSubmit} /> : null}
      </div>
    );
  }
}
