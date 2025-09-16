// Location Helper - Reusable GPS + Auto-suggestions functionality
class LocationHelper {
    constructor(inputId, suggestionsId, buttonId = null) {
      this.inputElement = document.getElementById(inputId);
      this.suggestionsElement = document.getElementById(suggestionsId);
      this.buttonElement = buttonId ? document.getElementById(buttonId) : null;
      this.debounceTimer = null;
      
      this.init();
    }
  
    init() {
      // Add auto-suggestions
      if (this.inputElement) {
        this.inputElement.addEventListener('input', (e) => this.handleInput(e));
      }
  
      // Add GPS location button
      if (this.buttonElement) {
        this.buttonElement.addEventListener('click', () => this.getCurrentLocation());
      }
  
      // Hide suggestions when clicking outside
      document.addEventListener('click', (e) => {
        if (!this.inputElement.contains(e.target)) {
          this.hideSuggestions();
        }
      });
    }
  
    handleInput(event) {
      const query = event.target.value;
      
      clearTimeout(this.debounceTimer);
      
      if (query.length < 3) {
        this.hideSuggestions();
        return;
      }
      
      this.debounceTimer = setTimeout(() => {
        this.fetchSuggestions(query);
      }, 300);
    }
  
    async fetchSuggestions(query) {
      try {
        const mapboxToken = document.querySelector('meta[name="mapbox-token"]').content;
        const url = `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(query)}.json?country=IN&types=poi,place,address,neighborhood&proximity=79.0882,21.1458&limit=5&access_token=${mapboxToken}`;
        
        const response = await fetch(url);
        const data = await response.json();
        
        this.displaySuggestions(data.features || []);
      } catch (error) {
        console.error('Error fetching suggestions:', error);
        this.hideSuggestions();
      }
    }
  
    displaySuggestions(features) {
      this.suggestionsElement.innerHTML = '';
      
      if (features.length === 0) {
        this.hideSuggestions();
        return;
      }
  
      features.forEach(feature => {
        const suggestion = document.createElement('div');
        suggestion.className = 'p-2 border-bottom suggestion-item';
        suggestion.style.cursor = 'pointer';
        suggestion.textContent = feature.place_name;
        
        suggestion.addEventListener('click', () => {
          this.inputElement.value = feature.place_name;
          this.hideSuggestions();
        });
        
        suggestion.addEventListener('mouseenter', () => {
          suggestion.style.backgroundColor = '#f8f9fa';
        });
        
        suggestion.addEventListener('mouseleave', () => {
          suggestion.style.backgroundColor = 'white';
        });
        
        this.suggestionsElement.appendChild(suggestion);
      });
      
      this.showSuggestions();
    }
  
    getCurrentLocation() {
      if (!navigator.geolocation) {
        alert('Geolocation is not supported by this browser.');
        return;
      }
  
      const originalHTML = this.buttonElement.innerHTML;
      this.buttonElement.innerHTML = '<i class="spinner-border spinner-border-sm"></i> Getting location...';
      this.buttonElement.disabled = true;
  
      navigator.geolocation.getCurrentPosition(
        (position) => {
          this.reverseGeocode(position.coords.latitude, position.coords.longitude);
        },
        (error) => {
          console.error('Location error:', error);
          alert('Location access denied. Please enter address manually.');
          this.buttonElement.innerHTML = originalHTML;
          this.buttonElement.disabled = false;
        }
      );
    }
  
    async reverseGeocode(lat, lng) {
      try {
        const mapboxToken = document.querySelector('meta[name="mapbox-token"]').content;
        const url = `https://api.mapbox.com/geocoding/v5/mapbox.places/${lng},${lat}.json?access_token=${mapboxToken}`;
        
        const response = await fetch(url);
        const data = await response.json();
        
        if (data.features && data.features.length > 0) {
          const address = data.features[0].place_name;
          this.inputElement.value = address;
        }
      } catch (error) {
        console.error('Error getting address:', error);
        alert('Could not get your location address');
      } finally {
        this.buttonElement.innerHTML = '<i class="bi bi-geo-alt-fill"></i> Use My Location';
        this.buttonElement.disabled = false;
      }
    }
  
    showSuggestions() {
      this.suggestionsElement.style.display = 'block';
    }
  
    hideSuggestions() {
      this.suggestionsElement.style.display = 'none';
    }
}