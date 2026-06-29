import { createSlice, createAsyncThunk } from '@reduxjs/toolkit'
import api from '../../api/dineflow'

const stored = JSON.parse(localStorage.getItem('dineflow_auth') || 'null')

export const loginUser = createAsyncThunk('auth/login', async (credentials, { rejectWithValue }) => {
  try {
    const { data } = await api.post('/auth/login', credentials)
    return data
  } catch (err) {
    return rejectWithValue(
      err.response?.data?.message
      || (err.code === 'ERR_NETWORK' ? 'Cannot reach server. Start the backend on port 5000.' : 'Login failed')
    )
  }
})

export const registerUser = createAsyncThunk('auth/register', async (payload, { rejectWithValue }) => {
  try {
    const { data } = await api.post('/auth/register', payload)
    return data
  } catch (err) {
    return rejectWithValue(err.response?.data?.message || 'Registration failed')
  }
})

export const fetchMe = createAsyncThunk('auth/me', async (_, { rejectWithValue }) => {
  try {
    const { data } = await api.get('/auth/me')
    return data
  } catch (err) {
    return rejectWithValue(err.response?.data?.message || 'Failed')
  }
})

const authSlice = createSlice({
  name: 'auth',
  initialState: {
    user: stored?.user || null,
    accessToken: stored?.accessToken || null,
    refreshToken: stored?.refreshToken || null,
    memberships: stored?.memberships || [],
    loading: false,
    error: null,
  },
  reducers: {
    logout(state) {
      state.user = null
      state.accessToken = null
      state.refreshToken = null
      state.memberships = []
      localStorage.removeItem('dineflow_auth')
    },
    setTokens(state, action) {
      state.accessToken = action.payload.accessToken
      state.refreshToken = action.payload.refreshToken
      persist(state)
    },
    setCredentials(state, action) {
      state.user = action.payload.user
      state.accessToken = action.payload.accessToken
      state.refreshToken = action.payload.refreshToken
      state.memberships = action.payload.memberships || []
      state.loading = false
      state.error = null
      persist(state)
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(loginUser.pending, (s) => { s.loading = true; s.error = null })
      .addCase(loginUser.fulfilled, (s, a) => {
        s.loading = false
        s.user = a.payload.user
        s.accessToken = a.payload.accessToken
        s.refreshToken = a.payload.refreshToken
        s.memberships = a.payload.memberships || []
        persist(s)
      })
      .addCase(loginUser.rejected, (s, a) => { s.loading = false; s.error = a.payload })
      .addCase(registerUser.fulfilled, (s, a) => {
        s.user = a.payload.user
        s.accessToken = a.payload.accessToken
        s.refreshToken = a.payload.refreshToken
        s.memberships = a.payload.memberships || []
        persist(s)
      })
      .addCase(fetchMe.fulfilled, (s, a) => {
        s.user = a.payload.user
        s.memberships = a.payload.memberships || []
        persist(s)
      })
  },
})

function persist(state) {
  localStorage.setItem('dineflow_auth', JSON.stringify({
    user: state.user,
    accessToken: state.accessToken,
    refreshToken: state.refreshToken,
    memberships: state.memberships,
  }))
}

export const { logout, setTokens, setCredentials } = authSlice.actions
export default authSlice.reducer
