// Artisans Page JavaScript
document.addEventListener('DOMContentLoaded', function() {
    // Filter functionality
    const craftFilter = document.getElementById('craftFilter');
    const locationFilter = document.getElementById('locationFilter');
    const experienceFilter = document.getElementById('experienceFilter');
    const sortFilter = document.getElementById('sortFilter');
    const clearFiltersBtn = document.getElementById('clearFilters');
    const activeFiltersContainer = document.getElementById('activeFilters');
    
    // Store current filters
    let activeFilters = [];
    
    // Update active filters display
    function updateActiveFilters() {
        activeFiltersContainer.innerHTML = '';
        activeFilters.forEach(filter => {
            const filterTag = document.createElement('span');
            filterTag.className = 'filter-tag';
            filterTag.innerHTML = `
                ${filter.label}: ${filter.value}
                <button class="remove-filter" data-type="${filter.type}">
                    <i class="fas fa-times"></i>
                </button>
            `;
            activeFiltersContainer.appendChild(filterTag);
        });
        
        // Add remove filter functionality
        document.querySelectorAll('.remove-filter').forEach(btn => {
            btn.addEventListener('click', function() {
                const type = this.getAttribute('data-type');
                removeFilter(type);
            });
        });
    }
    
    // Add filter
    function addFilter(type, label, value) {
        // Remove existing filter of same type
        activeFilters = activeFilters.filter(f => f.type !== type);
        
        if (value) {
            activeFilters.push({ type, label, value });
        }
        
        updateActiveFilters();
        filterArtisans();
    }
    
    // Remove filter
    function removeFilter(type) {
        activeFilters = activeFilters.filter(f => f.type !== type);
        
        // Reset corresponding select element
        switch(type) {
            case 'craft':
                craftFilter.value = '';
                break;
            case 'location':
                locationFilter.value = '';
                break;
            case 'experience':
                experienceFilter.value = '';
                break;
            case 'sort':
                sortFilter.value = 'featured';
                break;
        }
        
        updateActiveFilters();
        filterArtisans();
    }
    
    // Filter artisans based on active filters
    function filterArtisans() {
        const artisanCards = document.querySelectorAll('.artisan-card');
        let visibleCount = 0;
        
        artisanCards.forEach(card => {
            let show = true;
            
            activeFilters.forEach(filter => {
                const cardValue = card.getAttribute(`data-${filter.type}`);
                if (cardValue && filter.value && !cardValue.includes(filter.value)) {
                    show = false;
                }
            });
            
            if (show) {
                card.style.display = 'block';
                visibleCount++;
            } else {
                card.style.display = 'none';
            }
        });
        
        // Update results count
        document.getElementById('resultsCount').textContent = `${visibleCount} Artisans Found`;
        
        // Show/hide no results message
        const noResults = document.getElementById('noResults');
        if (visibleCount === 0 && activeFilters.length > 0) {
            noResults.style.display = 'block';
        } else {
            noResults.style.display = 'none';
        }
    }
    
    // Event listeners for filters
    craftFilter.addEventListener('change', function() {
        if (this.value) {
            const selectedOption = this.options[this.selectedIndex];
            addFilter('craft', 'Craft', selectedOption.text);
        } else {
            removeFilter('craft');
        }
    });
    
    locationFilter.addEventListener('change', function() {
        if (this.value) {
            const selectedOption = this.options[this.selectedIndex];
            addFilter('location', 'Location', selectedOption.text);
        } else {
            removeFilter('location');
        }
    });
    
    experienceFilter.addEventListener('change', function() {
        if (this.value) {
            const selectedOption = this.options[this.selectedIndex];
            addFilter('experience', 'Experience', selectedOption.text);
        } else {
            removeFilter('experience');
        }
    });
    
    sortFilter.addEventListener('change', function() {
        if (this.value && this.value !== 'featured') {
            const selectedOption = this.options[this.selectedIndex];
            addFilter('sort', 'Sort By', selectedOption.text);
        } else {
            removeFilter('sort');
        }
    });
    
    // Clear all filters
    clearFiltersBtn.addEventListener('click', function() {
        craftFilter.value = '';
        locationFilter.value = '';
        experienceFilter.value = '';
        sortFilter.value = 'featured';
        
        activeFilters = [];
        updateActiveFilters();
        filterArtisans();
    });
    
    // Recent search tags
    document.querySelectorAll('.search-tag').forEach(tag => {
        tag.addEventListener('click', function() {
            const searchTerm = this.textContent;
            document.getElementById('mainSearch').value = searchTerm;
            
            // Trigger search
            document.getElementById('searchBtn').click();
        });
    });
    
    // Initialize
    updateActiveFilters();
});