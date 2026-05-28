import { useCallback, useEffect, useMemo, useState } from 'react'
import { NavLink, Route, Routes } from 'react-router-dom'
import './App.css'

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000'
const USER_NAME_STORAGE_KEY = 'reservation_user_name'

function formatDateTime(value) {
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

function formatCreatedAt(value) {
  return formatDateTime(value)
}

function equipmentLabel(equipment) {
  if (!Array.isArray(equipment) || equipment.length === 0) {
    return 'Aucun equipement specifie'
  }
  return equipment.join(' • ')
}

function AppNav() {
  return (
    <nav className="app-nav">
      <NavLink to="/" end>
        Catalogue
      </NavLink>
      <NavLink to="/mes-reservations">Mes reservations</NavLink>
    </nav>
  )
}

function CataloguePage({
  rooms,
  roomsLoading,
  roomsError,
  selectedRoomId,
  selectedRoomDisplay,
  detailsLoading,
  detailsError,
  loadRooms,
  loadRoomDetails,
  handleSelectRoom,
}) {
  return (
    <main className="page">
      <header className="page-header">
        <h1>Catalogue des salles</h1>
        <p>Consulte les salles disponibles, leurs capacites et leurs equipements.</p>
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

          {!selectedRoomId && <p className="state">Selectionne une salle pour voir son detail.</p>}

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
            </article>
          )}
        </div>
      </section>
    </main>
  )
}

function MyReservationsPage() {
  const [userName, setUserName] = useState(
    () => localStorage.getItem(USER_NAME_STORAGE_KEY) || ''
  )
  const [reservations, setReservations] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [feedback, setFeedback] = useState({ type: '', message: '' })
  const [cancellingId, setCancellingId] = useState(null)

  const loadReservations = useCallback(async () => {
    const trimmedName = userName.trim()

    if (!trimmedName) {
      setError('Saisis ton nom pour afficher tes reservations.')
      setReservations([])
      return
    }

    try {
      setLoading(true)
      setError('')
      setFeedback({ type: '', message: '' })

      const response = await fetch(`${API_BASE_URL}/api/reservations`)
      if (!response.ok) {
        throw new Error('Impossible de recuperer les reservations.')
      }

      const data = await response.json()
      const mine = data.filter(
        (reservation) => reservation.user_name.toLowerCase() === trimmedName.toLowerCase()
      )

      setReservations(mine)
      localStorage.setItem(USER_NAME_STORAGE_KEY, trimmedName)
    } catch (loadError) {
      setError(loadError.message)
      setReservations([])
    } finally {
      setLoading(false)
    }
  }, [userName])

  async function handleCancel(reservationId) {
    try {
      setCancellingId(reservationId)
      setFeedback({ type: '', message: '' })

      const response = await fetch(`${API_BASE_URL}/api/reservations/${reservationId}`, {
        method: 'DELETE',
      })

      const payload = await response.json()

      if (!response.ok) {
        throw new Error(payload.error || 'Impossible d annuler la reservation.')
      }

      setFeedback({ type: 'success', message: 'Reservation annulee avec succes.' })
      await loadReservations()
    } catch (cancelError) {
      setFeedback({ type: 'error', message: cancelError.message })
    } finally {
      setCancellingId(null)
    }
  }

  return (
    <main className="page">
      <header className="page-header">
        <h1>Mes reservations</h1>
        <p>
          Consulte et annule tes reservations en cours. Saisis ton nom puis clique sur Afficher.
        </p>
      </header>

      <section className="panel">
        <form
          className="filter-form"
          onSubmit={(event) => {
            event.preventDefault()
            loadReservations()
          }}
        >
          <label htmlFor="filter_user_name">Votre nom</label>
          <div className="filter-row">
            <input
              id="filter_user_name"
              type="text"
              value={userName}
              onChange={(event) => setUserName(event.target.value)}
              placeholder="Ex: Adam"
            />
            <button type="submit" className="primary-btn" disabled={loading}>
              {loading ? 'Chargement...' : 'Afficher'}
            </button>
          </div>
        </form>

        {error && <p className="state error">{error}</p>}
        {feedback.message && (
          <p className={`state ${feedback.type === 'error' ? 'error' : 'success'}`}>
            {feedback.message}
          </p>
        )}

        {!loading && !error && userName.trim() && reservations.length === 0 && (
          <p className="state">Aucune reservation trouvee pour ce nom.</p>
        )}

        {!loading && reservations.length > 0 && (
          <ul className="reservation-list">
            {reservations.map((reservation) => (
              <li key={reservation.id} className="reservation-card">
                <div className="reservation-card-head">
                  <h3>{reservation.title}</h3>
                  <span className="badge">{reservation.room_name}</span>
                </div>
                <p>
                  <strong>Creneau :</strong> {formatDateTime(reservation.start_time)} →{' '}
                  {formatDateTime(reservation.end_time)}
                </p>
                <p>
                  <strong>Demandeur :</strong> {reservation.user_name}
                </p>
                <button
                  type="button"
                  className="danger-btn"
                  disabled={cancellingId === reservation.id}
                  onClick={() => handleCancel(reservation.id)}
                >
                  {cancellingId === reservation.id ? 'Annulation...' : 'Annuler'}
                </button>
              </li>
            ))}
          </ul>
        )}
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
    <>
      <AppNav />
      <Routes>
        <Route
          path="/"
          element={
            <CataloguePage
              rooms={rooms}
              roomsLoading={roomsLoading}
              roomsError={roomsError}
              selectedRoomId={selectedRoomId}
              selectedRoomDisplay={selectedRoomDisplay}
              detailsLoading={detailsLoading}
              detailsError={detailsError}
              loadRooms={loadRooms}
              loadRoomDetails={loadRoomDetails}
              handleSelectRoom={handleSelectRoom}
            />
          }
        />
        <Route path="/mes-reservations" element={<MyReservationsPage />} />
      </Routes>
    </>
  )
}

export default App
