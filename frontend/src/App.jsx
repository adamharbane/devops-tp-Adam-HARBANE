import { useEffect, useMemo, useState } from 'react'
import './App.css'

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000'

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

function App() {
  const [rooms, setRooms] = useState([])
  const [roomsLoading, setRoomsLoading] = useState(true)
  const [roomsError, setRoomsError] = useState('')
  const [selectedRoomId, setSelectedRoomId] = useState(null)
  const [selectedRoom, setSelectedRoom] = useState(null)
  const [detailsLoading, setDetailsLoading] = useState(false)
  const [detailsError, setDetailsError] = useState('')
  const [filters, setFilters] = useState({
    search: '',
    minCapacity: '',
    equipment: '',
  })

  const availableEquipments = useMemo(() => {
    const equipmentSet = new Set()
    rooms.forEach((room) => {
      ;(room.equipment || []).forEach((item) => equipmentSet.add(item))
    })
    return [...equipmentSet].sort()
  }, [rooms])

  const filteredRooms = useMemo(() => {
    const minCapacity = Number(filters.minCapacity)

    return rooms.filter((room) => {
      if (filters.search.trim()) {
        const query = filters.search.trim().toLowerCase()
        if (!room.name.toLowerCase().includes(query)) {
          return false
        }
      }

      if (filters.minCapacity) {
        if (Number.isNaN(minCapacity) || room.capacity < minCapacity) {
          return false
        }
      }

      if (filters.equipment && !(room.equipment || []).includes(filters.equipment)) {
        return false
      }

      return true
    })
  }, [rooms, filters])

  const selectedInFiltered = useMemo(
    () => filteredRooms.some((room) => room.id === selectedRoomId),
    [filteredRooms, selectedRoomId]
  )

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
      setRoomsError('Impossible de charger les salles. Verifie que l API tourne sur le port 3000.')
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

  function handleFilterChange(field, value) {
    setFilters((prev) => ({
      ...prev,
      [field]: value,
    }))
  }

  function handleResetFilters() {
    setFilters({
      search: '',
      minCapacity: '',
      equipment: '',
    })
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
          'Impossible de charger les salles. Verifie que l API tourne sur le port 3000.'
        )
      } finally {
        setRoomsLoading(false)
      }
    }

    initRooms()
  }, [])

  return (
    <main className="page">
      <header className="page-header">
        <p className="page-eyebrow">Plateforme de reservation</p>
        <h1>Catalogue des salles</h1>
        <p className="page-subtitle">
          Consulte les salles disponibles et filtre par nom, capacite ou equipement.
        </p>
      </header>

      {!roomsLoading && !roomsError && rooms.length > 0 && (
        <section className="panel panel-filters">
          <h2 className="panel-section-title">Filtres de recherche</h2>
          <form className="room-filters" onSubmit={(event) => event.preventDefault()}>
            <div className="filters-grid">
              <div className="filter-field">
                <label htmlFor="search">Nom de salle</label>
                <input
                  id="search"
                  type="text"
                  value={filters.search}
                  onChange={(event) => handleFilterChange('search', event.target.value)}
                  placeholder="Ex: War Room"
                />
              </div>
              <div className="filter-field">
                <label htmlFor="minCapacity">Capacite minimum</label>
                <input
                  id="minCapacity"
                  type="number"
                  min="1"
                  value={filters.minCapacity}
                  onChange={(event) => handleFilterChange('minCapacity', event.target.value)}
                  placeholder="Ex: 10"
                />
              </div>
              <div className="filter-field">
                <label htmlFor="equipment">Equipement</label>
                <select
                  id="equipment"
                  value={filters.equipment}
                  onChange={(event) => handleFilterChange('equipment', event.target.value)}
                >
                  <option value="">Tous</option>
                  {availableEquipments.map((item) => (
                    <option key={item} value={item}>
                      {item}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <div className="filters-actions">
              <p className="filter-result-count">
                {filteredRooms.length} salle(s) affichee(s) sur {rooms.length}
              </p>
              <button type="button" className="secondary-btn" onClick={handleResetFilters}>
                Reinitialiser
              </button>
            </div>
          </form>
        </section>
      )}

      <section className="layout">
        <div className="panel panel-list">
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

          {!roomsLoading && !roomsError && rooms.length > 0 && filteredRooms.length === 0 && (
            <p className="state">Aucune salle ne correspond aux filtres selectionnes.</p>
          )}

          {!roomsLoading && !roomsError && filteredRooms.length > 0 && (
            <ul className="room-list">
              {filteredRooms.map((room) => (
                <li key={room.id}>
                  <button
                    type="button"
                    className={`room-card ${selectedRoomId === room.id ? 'active' : ''}`}
                    onClick={() => handleSelectRoom(room.id)}
                  >
                    <div className="room-card-head">
                      <h3>{room.name}</h3>
                      <span className="capacity-badge">{room.capacity} places</span>
                    </div>
                    <p>{room.location || 'Emplacement non renseigne'}</p>
                    <p className="equipment">{equipmentLabel(room.equipment)}</p>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="panel panel-details">
          <h2 className="panel-section-title">Fiche salle</h2>

          {!selectedRoomId && <p className="state">Selectionne une salle pour voir son detail.</p>}

          {selectedRoomId && !selectedInFiltered && (
            <p className="state">La salle selectionnee ne correspond pas aux filtres actifs.</p>
          )}

          {selectedRoomId && selectedInFiltered && detailsLoading && (
            <p className="state">Chargement du detail...</p>
          )}

          {selectedRoomId && selectedInFiltered && !detailsLoading && detailsError && (
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

          {selectedRoomId && selectedInFiltered && !detailsLoading && !detailsError && selectedRoomDisplay && (
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

export default App
