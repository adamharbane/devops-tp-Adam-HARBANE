import { useEffect, useMemo, useState } from 'react'
import { Link, Route, Routes, useNavigate, useParams } from 'react-router-dom'
import './App.css'

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000'

function formatCreatedAt(value) {
  if (!value) {
    return 'Non renseigne'
  }

  const date = new Date(value)
  if (Number.isNaN(date.getTime())) {
    return 'Non renseigne'
  }

  return new Intl.DateTimeFormat('fr-FR', {
    dateStyle: 'long',
    timeStyle: 'short',
  }).format(date)
}

function equipmentLabel(equipment) {
  if (!Array.isArray(equipment) || equipment.length === 0) {
    return 'Aucun equipement specifie'
  }
  return equipment.join(' • ')
}

function ReservationPage({
  rooms,
  selectedRoomDisplay,
  loadRoomDetails,
  reservationForm,
  onFormChange,
  onSubmit,
  reservationLoading,
  reservationFeedback,
}) {
  const { roomId } = useParams()
  const navigate = useNavigate()
  const targetRoomId = Number(roomId)
  const targetRoom = useMemo(
    () => selectedRoomDisplay || rooms.find((room) => room.id === targetRoomId) || null,
    [rooms, selectedRoomDisplay, targetRoomId]
  )

  useEffect(() => {
    if (!Number.isNaN(targetRoomId)) {
      loadRoomDetails(targetRoomId)
    }
  }, [targetRoomId, loadRoomDetails])

  return (
    <main className="page">
      <header className="page-header">
        <h1>Reservation de salle</h1>
        <p>Cree une reservation sur le creneau de ton choix.</p>
      </header>

      <section className="panel details">
        <div className="panel-title-row">
          <h2>{targetRoom ? targetRoom.name : 'Salle introuvable'}</h2>
          <button type="button" className="secondary-btn" onClick={() => navigate('/')}>
            Retour au catalogue
          </button>
        </div>

        {targetRoom && (
          <div className="details-grid">
            <div>
              <span>Capacite</span>
              <strong>{targetRoom.capacity} places</strong>
            </div>
            <div>
              <span>Emplacement</span>
              <strong>{targetRoom.location || 'Non renseigne'}</strong>
            </div>
            <div>
              <span>Equipements</span>
              <strong>{equipmentLabel(targetRoom.equipment)}</strong>
            </div>
          </div>
        )}

        <div className="reservation-block">
          <h3>Creer une reservation</h3>
          <form className="reservation-form" onSubmit={onSubmit}>
            <label htmlFor="user_name">Nom du demandeur</label>
            <input
              id="user_name"
              name="user_name"
              type="text"
              value={reservationForm.user_name}
              onChange={onFormChange}
              placeholder="Ex: Adam"
            />

            <label htmlFor="title">Titre de la reservation</label>
            <input
              id="title"
              name="title"
              type="text"
              value={reservationForm.title}
              onChange={onFormChange}
              placeholder="Ex: Sprint planning"
            />

            <label htmlFor="start_time">Debut</label>
            <input
              id="start_time"
              name="start_time"
              type="datetime-local"
              value={reservationForm.start_time}
              onChange={onFormChange}
            />

            <label htmlFor="end_time">Fin</label>
            <input
              id="end_time"
              name="end_time"
              type="datetime-local"
              value={reservationForm.end_time}
              onChange={onFormChange}
            />

            <button type="submit" className="primary-btn" disabled={reservationLoading || !targetRoom}>
              {reservationLoading ? 'Reservation en cours...' : 'Valider la reservation'}
            </button>
          </form>

          {reservationFeedback.message && (
            <p className={`state ${reservationFeedback.type === 'error' ? 'error' : 'success'}`}>
              {reservationFeedback.message}
            </p>
          )}
        </div>
      </section>
    </main>
  )
}

function App() {
  const [rooms, setRooms] = useState([])
  const [roomsLoading, setRoomsLoading] = useState(true)
  const [roomsError, setRoomsError] = useState('')
  const [selectedRoomId, setSelectedRoomId] = useState(null)
  const [selectedRoom, setSelectedRoom] = useState(null)
  const [detailsLoading, setDetailsLoading] = useState(false)
  const [detailsError, setDetailsError] = useState('')
  const [reservationForm, setReservationForm] = useState({
    user_name: '',
    title: '',
    start_time: '',
    end_time: '',
  })
  const [reservationLoading, setReservationLoading] = useState(false)
  const [reservationFeedback, setReservationFeedback] = useState({
    type: '',
    message: '',
  })

  const selectedRoomFallback = useMemo(
    () => rooms.find((room) => room.id === selectedRoomId) || null,
    [rooms, selectedRoomId]
  )

  const selectedRoomDisplay = selectedRoom || selectedRoomFallback

  async function loadRooms() {
    try {
      setRoomsLoading(true)
      setRoomsError('')

      const response = await fetch(`${API_BASE_URL}/api/rooms`)
      if (!response.ok) {
        throw new Error('Impossible de recuperer les salles.')
      }

      const data = await response.json()
      setRooms(data)

      if (!selectedRoomId && data.length > 0) {
        const firstRoomId = data[0].id
        setSelectedRoomId(firstRoomId)
        loadRoomDetails(firstRoomId)
      }
    } catch {
      setRoomsError('Impossible de charger les salles. Verifie que l API tourne sur le port 4000.')
    } finally {
      setRoomsLoading(false)
    }
  }

  async function loadRoomDetails(roomId) {
    try {
      setDetailsLoading(true)
      setDetailsError('')

      const response = await fetch(`${API_BASE_URL}/api/rooms/${roomId}`)
      if (!response.ok) {
        throw new Error('Impossible de recuperer le detail de la salle.')
      }

      const data = await response.json()
      setSelectedRoom(data)
    } catch {
      setDetailsError('Impossible de charger le detail de cette salle.')
      setSelectedRoom(null)
    } finally {
      setDetailsLoading(false)
    }
  }

  function handleSelectRoom(roomId) {
    setSelectedRoomId(roomId)
    loadRoomDetails(roomId)
    setReservationFeedback({ type: '', message: '' })
  }

  function handleFormChange(event) {
    const { name, value } = event.target
    setReservationForm((prev) => ({
      ...prev,
      [name]: value,
    }))
  }

  async function handleReservationSubmit(event) {
    event.preventDefault()
    setReservationFeedback({ type: '', message: '' })

    if (!selectedRoomId) {
      setReservationFeedback({
        type: 'error',
        message: 'Selectionne une salle avant de reserver.',
      })
      return
    }

    if (
      !reservationForm.user_name.trim() ||
      !reservationForm.title.trim() ||
      !reservationForm.start_time ||
      !reservationForm.end_time
    ) {
      setReservationFeedback({
        type: 'error',
        message: 'Tous les champs de reservation sont obligatoires.',
      })
      return
    }

    try {
      setReservationLoading(true)

      const response = await fetch(`${API_BASE_URL}/api/reservations`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          room_id: selectedRoomId,
          user_name: reservationForm.user_name.trim(),
          title: reservationForm.title.trim(),
          start_time: new Date(reservationForm.start_time).toISOString(),
          end_time: new Date(reservationForm.end_time).toISOString(),
        }),
      })

      const payload = await response.json()

      if (!response.ok) {
        throw new Error(payload.error || 'Impossible de creer la reservation.')
      }

      setReservationFeedback({
        type: 'success',
        message: `Reservation creee pour ${selectedRoomDisplay?.name || 'la salle selectionnee'}.`,
      })
      setReservationForm({
        user_name: '',
        title: '',
        start_time: '',
        end_time: '',
      })
    } catch (error) {
      setReservationFeedback({
        type: 'error',
        message: error.message,
      })
    } finally {
      setReservationLoading(false)
    }
  }

  useEffect(() => {
    async function initRooms() {
      try {
        const response = await fetch(`${API_BASE_URL}/api/rooms`)
        if (!response.ok) {
          throw new Error('Impossible de recuperer les salles.')
        }

        const data = await response.json()
        setRooms(data)

        if (data.length > 0) {
          const firstRoomId = data[0].id
          setSelectedRoomId(firstRoomId)

          const detailResponse = await fetch(`${API_BASE_URL}/api/rooms/${firstRoomId}`)
          if (detailResponse.ok) {
            const detailData = await detailResponse.json()
            setSelectedRoom(detailData)
          }
        }
      } catch {
        setRoomsError(
          'Impossible de charger les salles. Verifie que l API tourne sur le port 4000.'
        )
      } finally {
        setRoomsLoading(false)
      }
    }

    initRooms()
  }, [])

  return (
    <Routes>
      <Route
        path="/"
        element={
          <main className="page">
            <header className="page-header">
              <h1>Catalogue des salles</h1>
              <p>Consulte les salles disponibles et reserve un creneau sur une page dediee.</p>
            </header>

            <section className="layout">
              <div className="panel">
                <div className="panel-title-row">
                  <h2>Liste des salles</h2>
                  <button type="button" className="secondary-btn" onClick={loadRooms}>
                    Rafraichir
                  </button>
                </div>

                {roomsLoading && <p className="state">Chargement des salles...</p>}

                {!roomsLoading && roomsError && (
                  <div className="state error">
                    <p>{roomsError}</p>
                    <button type="button" className="secondary-btn" onClick={loadRooms}>
                      Reessayer
                    </button>
                  </div>
                )}

                {!roomsLoading && !roomsError && rooms.length === 0 && (
                  <p className="state">Aucune salle disponible pour le moment.</p>
                )}

                {!roomsLoading && !roomsError && rooms.length > 0 && (
                  <ul className="room-list">
                    {rooms.map((room) => (
                      <li key={room.id}>
                        <button
                          type="button"
                          className={`room-card ${selectedRoomId === room.id ? 'active' : ''}`}
                          onClick={() => handleSelectRoom(room.id)}
                        >
                          <div className="room-card-head">
                            <h3>{room.name}</h3>
                            <span>{room.capacity} places</span>
                          </div>
                          <p>{room.location || 'Emplacement non renseigne'}</p>
                          <p className="equipment">{equipmentLabel(room.equipment)}</p>
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
              </div>

              <div className="panel details">
                <h2>Fiche salle</h2>

                {!selectedRoomId && (
                  <p className="state">Selectionne une salle pour voir son detail.</p>
                )}

                {selectedRoomId && detailsLoading && <p className="state">Chargement du detail...</p>}

                {selectedRoomId && !detailsLoading && detailsError && (
                  <div className="state error">
                    <p>{detailsError}</p>
                    <button
                      type="button"
                      className="secondary-btn"
                      onClick={() => loadRoomDetails(selectedRoomId)}
                    >
                      Reessayer
                    </button>
                  </div>
                )}

                {selectedRoomId && !detailsLoading && !detailsError && selectedRoomDisplay && (
                  <article className="details-card">
                    <h3>{selectedRoomDisplay.name}</h3>
                    <div className="details-grid">
                      <div>
                        <span>Capacite</span>
                        <strong>{selectedRoomDisplay.capacity} places</strong>
                      </div>
                      <div>
                        <span>Emplacement</span>
                        <strong>{selectedRoomDisplay.location || 'Non renseigne'}</strong>
                      </div>
                      <div>
                        <span>Equipements</span>
                        <strong>{equipmentLabel(selectedRoomDisplay.equipment)}</strong>
                      </div>
                      <div>
                        <span>Ajoutee le</span>
                        <strong>{formatCreatedAt(selectedRoomDisplay.created_at)}</strong>
                      </div>
                    </div>
                    <div className="reservation-action">
                      <Link to={`/reservation/${selectedRoomDisplay.id}`} className="primary-btn">
                        Reserver
                      </Link>
                    </div>
                  </article>
                )}
              </div>
            </section>
          </main>
        }
      />
      <Route
        path="/reservation/:roomId"
        element={
          <ReservationPage
            rooms={rooms}
            selectedRoomDisplay={selectedRoomDisplay}
            loadRoomDetails={loadRoomDetails}
            reservationForm={reservationForm}
            onFormChange={handleFormChange}
            onSubmit={handleReservationSubmit}
            reservationLoading={reservationLoading}
            reservationFeedback={reservationFeedback}
          />
        }
      />
    </Routes>
  )
}

export default App
