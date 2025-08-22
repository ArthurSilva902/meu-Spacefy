import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Button, Badge, Spinner, Alert, Form } from 'react-bootstrap';
import { FaStar, FaRegStar, FaCheckCircle, FaTimesCircle, FaClock } from 'react-icons/fa';
import { toast } from 'react-toastify';
import api from '../../services/api';
import OwnerAssessmentModal from '../../Components/OwnerAssessmentModal';
import UserRatingCard from '../../Components/UserRatingCard';

const ProprietarioAvaliacoes = () => {
  const [rentals, setRentals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedRental, setSelectedRental] = useState(null);
  const [showAssessmentModal, setShowAssessmentModal] = useState(false);
  const [filterStatus, setFilterStatus] = useState('all');

  useEffect(() => {
    fetchOwnerRentals();
  }, []);

  const fetchOwnerRentals = async () => {
    try {
      setLoading(true);
      const response = await api.get('/rentals/owner'); // Assumindo que existe esta rota
      setRentals(response.data || []);
    } catch (error) {
      console.error('Erro ao buscar alugueis:', error);
      setError('Erro ao carregar alugueis');
    } finally {
      setLoading(false);
    }
  };

  const handleAssessmentSuccess = () => {
    fetchOwnerRentals(); // Recarrega a lista
    toast.success('Avaliação enviada com sucesso!');
  };

  const openAssessmentModal = (rental) => {
    setSelectedRental(rental);
    setShowAssessmentModal(true);
  };

  const getRentalStatus = (rental) => {
    const now = new Date();
    const endDate = new Date(rental.end_date);
    
    if (endDate < now) {
      return { status: 'completed', label: 'Concluído', variant: 'success', icon: <FaCheckCircle /> };
    } else if (new Date(rental.start_date) <= now && now <= endDate) {
      return { status: 'active', label: 'Ativo', variant: 'primary', icon: <FaClock /> };
    } else {
      return { status: 'pending', label: 'Pendente', variant: 'warning', icon: <FaClock /> };
    }
  };

  const canAssess = (rental) => {
    const now = new Date();
    const endDate = new Date(rental.end_date);
    return endDate < now && !rental.hasOwnerAssessment;
  };

  const filteredRentals = rentals.filter(rental => {
    if (filterStatus === 'all') return true;
    if (filterStatus === 'completed') return new Date(rental.end_date) < new Date();
    if (filterStatus === 'active') {
      const now = new Date();
      return new Date(rental.start_date) <= now && now <= new Date(rental.end_date);
    }
    if (filterStatus === 'pending') return new Date(rental.start_date) > new Date();
    return true;
  });

  if (loading) {
    return (
      <Container className="mt-4">
        <div className="text-center">
          <Spinner animation="border" variant="primary" size="lg" />
          <p className="mt-3">Carregando seus alugueis...</p>
        </div>
      </Container>
    );
  }

  if (error) {
    return (
      <Container className="mt-4">
        <Alert variant="danger">
          <h4>Erro ao carregar dados</h4>
          <p>{error}</p>
          <Button variant="outline-danger" onClick={fetchOwnerRentals}>
            Tentar novamente
          </Button>
        </Alert>
      </Container>
    );
  }

  return (
    <Container className="mt-4">
      <Row>
        <Col>
          <div className="d-flex justify-content-between align-items-center mb-4">
            <h2>Avaliações de Locatários</h2>
            <Badge bg="info" className="fs-6">
              {rentals.length} aluguel{rentals.length !== 1 ? 'eis' : ''} total
            </Badge>
          </div>

          {/* Filtros */}
          <Card className="mb-4">
            <Card.Body>
              <Row>
                <Col md={6}>
                  <Form.Group>
                    <Form.Label><strong>Filtrar por Status:</strong></Form.Label>
                    <Form.Select
                      value={filterStatus}
                      onChange={(e) => setFilterStatus(e.target.value)}
                    >
                      <option value="all">Todos os alugueis</option>
                      <option value="completed">Concluídos</option>
                      <option value="active">Ativos</option>
                      <option value="pending">Pendentes</option>
                    </Form.Select>
                  </Form.Group>
                </Col>
                <Col md={6}>
                  <div className="d-flex align-items-end h-100">
                    <div className="w-100">
                      <small className="text-muted d-block mb-1">Legenda:</small>
                      <div className="d-flex gap-2">
                        <Badge bg="success">Concluído</Badge>
                        <Badge bg="primary">Ativo</Badge>
                        <Badge bg="warning">Pendente</Badge>
                      </div>
                    </div>
                  </div>
                </Col>
              </Row>
            </Card.Body>
          </Card>

          {/* Lista de Alugueis */}
          {filteredRentals.length === 0 ? (
            <Card>
              <Card.Body className="text-center">
                <p className="text-muted mb-0">
                  {filterStatus === 'all' 
                    ? 'Você ainda não possui alugueis'
                    : `Nenhum aluguel ${filterStatus === 'completed' ? 'concluído' : filterStatus === 'active' ? 'ativo' : 'pendente'} encontrado`
                  }
                </p>
              </Card.Body>
            </Card>
          ) : (
            <Row>
              {filteredRentals.map((rental) => {
                const status = getRentalStatus(rental);
                const canAssessRental = canAssess(rental);

                return (
                  <Col key={rental._id} lg={6} xl={4} className="mb-4">
                    <Card className="h-100 rental-card">
                      <Card.Header className="d-flex justify-content-between align-items-center">
                        <Badge bg={status.variant}>
                          {status.icon} {status.label}
                        </Badge>
                        {rental.hasOwnerAssessment && (
                          <Badge bg="success">
                            <FaCheckCircle /> Avaliado
                          </Badge>
                        )}
                      </Card.Header>
                      
                      <Card.Body>
                        <h6 className="card-title">{rental.space?.space_name || 'Espaço N/A'}</h6>
                        
                        <div className="rental-details mb-3">
                          <p className="mb-1">
                            <strong>Locatário:</strong> {rental.user?.name || 'N/A'}
                          </p>
                          <p className="mb-1">
                            <strong>Data:</strong> {new Date(rental.start_date).toLocaleDateString('pt-BR')} - {new Date(rental.end_date).toLocaleDateString('pt-BR')}
                          </p>
                          <p className="mb-1">
                            <strong>Horário:</strong> {rental.startTime} - {rental.endTime}
                          </p>
                          <p className="mb-0">
                            <strong>Valor:</strong> R$ {rental.value?.toFixed(2) || 'N/A'}
                          </p>
                        </div>

                        {/* Rating do Locatário */}
                        <UserRatingCard 
                          userId={rental.user?._id} 
                          showDetails={false}
                        />

                        {/* Botão de Avaliação */}
                        {canAssessRental && (
                          <div className="text-center mt-3">
                            <Button
                              variant="primary"
                              onClick={() => openAssessmentModal(rental)}
                              className="w-100"
                            >
                              <FaStar className="me-2" />
                              Avaliar Locatário
                            </Button>
                          </div>
                        )}

                        {!canAssessRental && status.status === 'completed' && rental.hasOwnerAssessment && (
                          <div className="text-center mt-3">
                            <Badge bg="success" className="fs-6">
                              <FaCheckCircle className="me-2" />
                              Locatário já avaliado
                            </Badge>
                          </div>
                        )}

                        {!canAssessRental && status.status === 'completed' && !rental.hasOwnerAssessment && (
                          <div className="text-center mt-3">
                            <Badge bg="secondary" className="fs-6">
                              <FaTimesCircle className="me-2" />
                              Aguardando conclusão
                            </Badge>
                          </div>
                        )}
                      </Card.Body>
                    </Card>
                  </Col>
                );
              })}
            </Row>
          )}
        </Col>
      </Row>

      {/* Modal de Avaliação */}
      <OwnerAssessmentModal
        show={showAssessmentModal}
        onHide={() => setShowAssessmentModal(false)}
        rental={selectedRental}
        onSuccess={handleAssessmentSuccess}
      />
    </Container>
  );
};

export default ProprietarioAvaliacoes;
