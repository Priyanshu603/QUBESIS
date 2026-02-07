import React, { useState, useEffect, useContext } from 'react';
import axios from 'axios';
import { Container, Row, Col, Card, Button, Table, Badge, Alert } from 'react-bootstrap';
import AuthContext from '../context/AuthContext';
import Asteroid3D from './Asteroid3D';

const Dashboard = () => {
  const [asteroids, setAsteroids] = useState([]);
  const [watchedAsteroids, setWatchedAsteroids] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const { user, logout } = useContext(AuthContext);

  useEffect(() => {
    if (user) {
      fetchAsteroids();
      fetchWatchedAsteroids();
    }
  }, [user]);

  const fetchAsteroids = async () => {
    try {
      const response = await axios.get('/asteroids/feed');
      setAsteroids(response.data.asteroids);
    } catch (err) {
      setError('Failed to fetch asteroid data');
    } finally {
      setLoading(false);
    }
  };

  const fetchWatchedAsteroids = async () => {
    try {
      const response = await axios.get('/asteroids/watched');
      setWatchedAsteroids(response.data);
    } catch (err) {
      console.error('Failed to fetch watched asteroids');
    }
  };

  const watchAsteroid = async (asteroidId) => {
    try {
      await axios.post(`/asteroids/watch/${asteroidId}`);
      fetchWatchedAsteroids();
    } catch (err) {
      setError('Failed to add asteroid to watch list');
    }
  };

  const getRiskColor = (isHazardous) => {
    return isHazardous ? 'danger' : 'success';
  };

  if (!user) {
    return <div>Please log in to access the dashboard.</div>;
  }

  return (
    <Container fluid className="mt-4">
      <Row>
        <Col>
          <h1 className="mb-4">Cosmic Watch Dashboard</h1>
          {error && <Alert variant="danger">{error}</Alert>}
        </Col>
      </Row>

      <Row>
        <Col md={8}>
          <Card className="mb-4">
            <Card.Header>
              <h3>Near-Earth Objects Feed</h3>
            </Card.Header>
            <Card.Body>
              {loading ? (
                <div>Loading asteroid data...</div>
              ) : (
                <Table striped bordered hover responsive>
                  <thead>
                    <tr>
                      <th>Name</th>
                      <th>Diameter (km)</th>
                      <th>Velocity (km/h)</th>
                      <th>Miss Distance (km)</th>
                      <th>Hazardous</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {asteroids.map((asteroid) => (
                      <tr key={asteroid.id}>
                        <td>{asteroid.name}</td>
                        <td>{asteroid.diameter_min.toFixed(2)} - {asteroid.diameter_max.toFixed(2)}</td>
                        <td>{asteroid.velocity.toFixed(2)}</td>
                        <td>{asteroid.miss_distance.toLocaleString()}</td>
                        <td>
                          <Badge bg={getRiskColor(asteroid.is_hazardous)}>
                            {asteroid.is_hazardous ? 'Yes' : 'No'}
                          </Badge>
                        </td>
                        <td>
                          <Button
                            variant="primary"
                            size="sm"
                            onClick={() => watchAsteroid(asteroid.id)}
                            disabled={watchedAsteroids.some(w => w.asteroid_id === asteroid.id)}
                          >
                            {watchedAsteroids.some(w => w.asteroid_id === asteroid.id) ? 'Watching' : 'Watch'}
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </Table>
              )}
            </Card.Body>
          </Card>
        </Col>

        <Col md={4}>
          <Card className="mb-4">
            <Card.Header>
              <h3>Watched Asteroids</h3>
            </Card.Header>
            <Card.Body>
              {watchedAsteroids.length === 0 ? (
                <p>No asteroids in watch list</p>
              ) : (
                <ul className="list-group">
                  {watchedAsteroids.map((watched) => {
                    const asteroid = asteroids.find(a => a.id === watched.asteroid_id);
                    return (
                      <li key={watched.id} className="list-group-item">
                        {asteroid ? asteroid.name : `Asteroid ${watched.asteroid_id}`}
                      </li>
                    );
                  })}
                </ul>
              )}
            </Card.Body>
          </Card>

          <Card>
            <Card.Header>
              <h3>3D Visualization</h3>
            </Card.Header>
            <Card.Body>
              <Asteroid3D asteroids={asteroids.slice(0, 5)} />
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </Container>
  );
};

export default Dashboard;
