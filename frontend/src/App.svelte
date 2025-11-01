<script>
  /**
   * UK VRM Lookup Application
   *
   * Simple Svelte component that:
   * 1. Takes a UK registration number as input
   * 2. Calls the backend API to fetch vehicle details
   * 3. Displays the results to the user
   */

  let plate = ''
  let result = null
  let loading = false
  let error = null

  /**
   * API URL configuration
   * In development: uses Vite proxy to local backend
   * In production: uses environment variable or deployed backend
   */
  // @ts-ignore - Vite env types
  const API_URL = import.meta.env?.DEV 
    ? '/lookup' 
    : 'https://help-clamper.onrender.com/lookup'

  /**
   * Handle form submission
   * Sends the registration plate to the backend API
   */
  async function handleLookup() {
    loading = true
    error = null
    result = null

    try {
      const response = await fetch(API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ plate }),
      })

      const text = await response.text()
      
      if (!response.ok) {
        try {
          const data = JSON.parse(text)
          throw new Error(data.detail || 'Vehicle not found')
        } catch {
          throw new Error('Vehicle not found. Please check the registration number.')
        }
      }

      if (!text || text.trim() === '') {
        throw new Error('No data received from server')
      }

      result = JSON.parse(text)
    } catch (err) {
      error = err.message === 'Failed to fetch' 
        ? 'Unable to connect to server. Please try again.' 
        : err.message
      console.error('Lookup error:', err)
    } finally {
      loading = false
    }
  }

  /**
   * Handle Enter key press
   */
  function handleKeydown(e) {
    if (e.key === 'Enter') {
      handleLookup()
    }
  }

  /**
   * Format plate as user types (uppercase, remove spaces)
   */
  function formatPlate(value) {
    return value.toUpperCase().replace(/\s+/g, '')
  }

  function handleInput(e) {
    plate = formatPlate(e.target.value)
  }
</script>

<div class="container">
  <header>
    <h1>UK Vehicle Registration Lookup</h1>
    <p>Enter a UK registration number</p>
  </header>

  <main>
    <div class="search-box">
      <div class="plate-input">
        <div class="uk-badge">
          <img src="/icons/uk-flag.png" alt="UK Flag" class="uk-flag" />
          <div class="uk-text">GB</div>
        </div>
        <input
          type="text"
          placeholder="WR22XRX"
          bind:value={plate}
          on:input={handleInput}
          on:keydown={handleKeydown}
          disabled={loading}
          maxlength="8"
          class="plate-text"
        />
      </div>
      <button on:click={handleLookup} disabled={loading || !plate}>
        {loading ? 'Searching...' : 'Search'}
      </button>
    </div>

    {#if error}
      <div class="error">
        <svg class="error-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor">
          <circle cx="12" cy="12" r="10" stroke-width="2"/>
          <line x1="12" y1="8" x2="12" y2="12" stroke-width="2"/>
          <line x1="12" y1="16" x2="12.01" y2="16" stroke-width="2"/>
        </svg>
        <p>{error}</p>
      </div>
    {/if}

    {#if result}
      <div class="result">
        {#if result.make}
          <div class="result-item">
            <span class="label">Make:</span>
            <span class="value">{result.make}</span>
          </div>
        {/if}
        
        {#if result.model}
          <div class="result-item">
            <span class="label">Model:</span>
            <span class="value">{result.model}</span>
          </div>
        {/if}
        
        {#if result.colour}
          <div class="result-item">
            <span class="label">Colour:</span>
            <span class="value">{result.colour}</span>
          </div>
        {/if}
        
        {#if result.year_of_manufacture}
          <div class="result-item">
            <span class="label">Year:</span>
            <span class="value">{result.year_of_manufacture}</span>
          </div>
        {/if}
        
        {#if result.fuel_type}
          <div class="result-item">
            <span class="label">Fuel Type:</span>
            <span class="value">{result.fuel_type}</span>
          </div>
        {/if}
      </div>
    {/if}
  </main>

  <footer>
    <p>
      Data from
      <a href="https://developer-portal.driver-vehicle-licensing.api.gov.uk/" target="_blank">
        DVLA API Developer Portal
      </a>
    </p>
  </footer>
</div>

<style>
  * {
    margin: 0;
    padding: 0;
    box-sizing: border-box;
  }

  :global(body) {
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen,
      Ubuntu, Cantarell, sans-serif;
    background: linear-gradient(135deg, #1e3a8a 0%, #312e81 50%, #1e293b 100%);
    min-height: 100vh;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .container {
    width: 100%;
    max-width: 500px;
    background: white;
    border-radius: 16px;
    box-shadow: 0 25px 50px rgba(0, 0, 0, 0.4);
    overflow: hidden;
  }

  header {
    background: linear-gradient(135deg, #003d7a 0%, #1e3a8a 100%);
    color: white;
    padding: 32px 24px;
    text-align: center;
    position: relative;
  }

  header::after {
    content: '';
    position: absolute;
    bottom: 0;
    left: 0;
    right: 0;
    height: 3px;
    background: linear-gradient(90deg, #ffd700 0%, #ffa500 100%);
  }

  header h1 {
    font-size: 26px;
    margin-bottom: 8px;
    font-weight: 700;
    letter-spacing: -0.5px;
  }

  header p {
    font-size: 14px;
    opacity: 0.95;
    font-weight: 400;
  }

  main {
    padding: 24px 20px;
  }

  .search-box {
    display: flex;
    gap: 10px;
    margin-bottom: 20px;
    align-items: stretch; /* Garante mesma altura */
  }

  .plate-input {
    flex: 1; /* ← ADICIONA ISTO */
    display: flex;
    align-items: center;
    background: #ffd700;
    border: 3px solid #414040;
    border-radius: 10px;
    overflow: hidden;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
    min-height: 60px;
  }

  .uk-badge {
    background: #003d7a;
    padding: 8px 6px;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    min-width: 50px;
    gap: 4px;
  }

  .uk-flag {
    width: 28px;
    height: auto;
    display: block;
  }

  .uk-text {
    color: #f5f5f4;
    font-weight: bold;
    font-size: 11px;
    font-family: 'Arial Black', sans-serif;
    letter-spacing: 0.5px;
  }

  .plate-text {
    padding: 8px 12px;
    border: none;
    background: #ffd700;
    font-size: 26px;
    font-family: 'Charles Wright', 'Arial Black', monospace;
    letter-spacing: 2px;
    color: #000;
    text-transform: uppercase;
    width: 200px; /* Largura fixa apropriada para 7-8 caracteres */
  }

  .plate-text::placeholder {
    color: rgba(0, 0, 0, 0.3);
    letter-spacing: 2px;
  }

  .plate-text:focus {
    outline: none;
  }

  .plate-text:disabled {
    background: #e6c200;
    cursor: not-allowed;
  }

  button {
    padding: 12px 20px;
    background: #667eea;
    color: white;
    border: none;
    border-radius: 8px;
    font-size: 15px;
    font-weight: 600;
    cursor: pointer;
    transition: background 0.3s;
    white-space: nowrap;
    min-width: 100px;
    align-self: stretch; /* ← Ocupa toda altura disponível */
  }

  button:hover:not(:disabled) {
    background: #003d7a;
  }

  button:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }

  .error {
    background: linear-gradient(135deg, #fff5f5 0%, #fee 100%);
    border-left: 4px solid #e53e3e;
    color: #c53030;
    padding: 16px;
    border-radius: 8px;
    margin-bottom: 20px;
    font-size: 14px;
    display: flex;
    align-items: center;
    gap: 12px;
    box-shadow: 0 2px 8px rgba(229, 62, 62, 0.1);
  }

  .error-icon {
    width: 24px;
    height: 24px;
    flex-shrink: 0;
    color: #e53e3e;
  }

  .error p {
    margin: 0;
    font-weight: 500;
  }

  .result {
    background: #f8f9fa;
    border-radius: 8px;
    padding: 16px;
    border: 1px solid #e0e0e0;
  }

  .result-item {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 10px 0;
    border-bottom: 1px solid #e9ecef;
  }

  .result-item:last-child {
    border-bottom: none;
  }

  .label {
    font-weight: 600;
    color: #495057;
    font-size: 14px;
  }

  .value {
    color: #212529;
    font-weight: 500;
    font-size: 14px;
    text-align: right;
  }

  footer {
    background: #f8f9fa;
    padding: 12px;
    text-align: center;
    font-size: 11px;
    color: #6c757d;
    border-top: 1px solid #e0e0e0;
  }

  footer a {
    color: #667eea;
    text-decoration: none;
  }

  footer a:hover {
    text-decoration: underline;
  }
</style>