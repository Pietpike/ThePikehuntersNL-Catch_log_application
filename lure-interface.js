/*
================================================================================
OPTION B IMPLEMENTATION: lure-interface.js - Architectural Improvement
================================================================================
LURE SELECTOR SYSTEM - WITH TOGGLE-BASED FORM APPROACH
- FIXED: Eliminates modal replacement logic completely
- IMPROVED: Toggle between "browse mode" and "add mode" 
- ENHANCED: Maintains original modal structure with proper CSS classes
- COMPLETE: All Fase 1.2 extended properties and validation
================================================================================
*/

// Lure selector variables
let currentLureInput = null;
let currentLureCategory = 'all';
let initializationAttempts = 0;
let maxInitializationAttempts = 20;
let fallbackMode = false;
let initializationTimer = null;

// ================================
// ENHANCED INITIALIZATION WITH SMART RETRY LOGIC
// ================================

function initLureSelector() {
    initializationAttempts++;
    console.log(`Initializing Lure Selector (attempt ${initializationAttempts}/${maxInitializationAttempts})...`);
    
    try {
        if (initializationTimer) {
            clearTimeout(initializationTimer);
            initializationTimer = null;
        }
        
        if (initializationAttempts > maxInitializationAttempts) {
            console.warn(`Maximum initialization attempts (${maxInitializationAttempts}) reached. Switching to fallback mode.`);
            initLureSelectorFallback();
            return;
        }
        
        if (typeof LureManager === 'undefined') {
            console.warn(`LureManager not yet available (attempt ${initializationAttempts}). Retrying in ${getRetryDelay()}ms...`);
            scheduleRetry();
            return;
        }
        
        if (typeof LureManager.init !== 'function') {
            console.error('LureManager exists but init method is missing.');
            initLureSelectorFallback();
            return;
        }
        
        console.log('LureManager found and valid. Initializing...');
        LureManager.init();
        
        if (typeof DropdownManager !== 'undefined' && typeof DropdownManager.init === 'function') {
            DropdownManager.init();
            console.log('DropdownManager also initialized');
        } else {
            console.warn('DropdownManager not available - continuing without it');
        }
        
        updateLureGrid();
        setupModalEvents();
        
        console.log('✅ Lure Selector initialized successfully!');
        initializationAttempts = 0;
        fallbackMode = false;
        
    } catch (error) {
        console.error('Error initializing Lure Selector:', error);
        
        if (initializationAttempts >= maxInitializationAttempts) {
            initLureSelectorFallback();
        } else {
            scheduleRetry();
        }
    }
}

function scheduleRetry() {
    const delay = getRetryDelay();
    initializationTimer = setTimeout(initLureSelector, delay);
}

function getRetryDelay() {
    if (initializationAttempts <= 5) return 100;
    if (initializationAttempts <= 10) return 250;
    if (initializationAttempts <= 15) return 500;
    return 1000;
}

function initLureSelectorFallback() {
    console.log('🔄 Running enhanced fallback Lure Selector initialization...');
    fallbackMode = true;
    
    try {
        if (initializationTimer) {
            clearTimeout(initializationTimer);
            initializationTimer = null;
        }
        
        updateLureGridFallback();
        setupModalEvents();
        
        console.log('✅ Fallback Lure Selector initialization completed');
        startPeriodicCheck();
        
    } catch (error) {
        console.error('❌ Fallback initialization also failed:', error);
        displayCriticalError();
    }
}

function startPeriodicCheck() {
    const checkInterval = setInterval(() => {
        if (typeof LureManager !== 'undefined' && typeof LureManager.init === 'function') {
            console.log('🎉 LureManager now available - reinitializing from fallback mode...');
            clearInterval(checkInterval);
            initializationAttempts = 0;
            initLureSelector();
        }
    }, 5000);
    
    setTimeout(() => {
        clearInterval(checkInterval);
        console.log('Stopped periodic LureManager checking after 5 minutes');
    }, 300000);
}

// ================================
// MODAL EVENT SETUP
// ================================

function setupModalEvents() {
    const modal = document.getElementById('lureModal');
    if (modal) {
        modal.removeEventListener('click', handleModalClick);
        modal.addEventListener('click', handleModalClick);
    }
}

function handleModalClick(e) {
    if (e.target === e.currentTarget) {
        closeLureModal();
    }
}

// ================================
// LURE SELECTOR FUNCTIONS
// ================================

function openLureModal(inputElement) {
    currentLureInput = inputElement;
    const modal = document.getElementById('lureModal');
    if (modal) {
        modal.style.display = 'block';
    }
    
    const searchInput = document.getElementById('lureSearchInput');
    if (searchInput) {
        searchInput.value = '';
    }
    
    currentLureCategory = 'all';
    updateCategoryTabs();
    updateLureGrid();
}

function closeLureModal() {
    const modal = document.getElementById('lureModal');
    if (modal) {
        modal.style.display = 'none';
    }
    currentLureInput = null;
}

function selectLure(lureName) {
    if (currentLureInput) {
        currentLureInput.value = lureName;
        const event = new Event('change');
        currentLureInput.dispatchEvent(event);
    }
    closeLureModal();
}

function filterLureCategory(category) {
    currentLureCategory = category;
    updateCategoryTabs();
    updateLureGrid();
}

function searchLures(query) {
    updateLureGrid(query);
}

// ================================
// UI UPDATE FUNCTIONS
// ================================

function updateCategoryTabs() {
    const tabsContainer = document.getElementById('lureCategoryTabs');
    if (!tabsContainer) return;
    
    tabsContainer.innerHTML = '';
    
    const allTab = document.createElement('button');
    allTab.className = 'lure-category-tab ' + (currentLureCategory === 'all' ? 'active' : '');
    allTab.textContent = 'Alle';
    allTab.onclick = function() { filterLureCategory('all'); };
    tabsContainer.appendChild(allTab);
    
    if (!fallbackMode && typeof LureManager !== 'undefined' && typeof LureManager.getAllBrands === 'function') {
        try {
            const brands = LureManager.getAllBrands();
            brands.forEach(function(brand) {
                const tab = createBrandTab(brand);
                tabsContainer.appendChild(tab);
            });
        } catch (error) {
            console.error('Error loading brand tabs:', error);
        }
    } else {
        const placeholderTab = document.createElement('button');
        placeholderTab.className = 'lure-category-tab disabled';
        placeholderTab.textContent = 'Merken laden...';
        placeholderTab.disabled = true;
        tabsContainer.appendChild(placeholderTab);
    }
}

function createBrandTab(brand) {
    const tab = document.createElement('button');
    tab.className = 'lure-category-tab ' + (currentLureCategory === brand ? 'active' : '');
    tab.textContent = brand;
    tab.onclick = function() { filterLureCategory(brand); };
    
    tab.oncontextmenu = function(e) {
        e.preventDefault();
        if (brand !== 'Eigen' && confirm('Merk "' + brand + '" verwijderen?\n\nLet op: Dit kan alleen als er geen aas van dit merk is.')) {
            if (typeof LureManager.removeBrand === 'function' && LureManager.removeBrand(brand)) {
                showStatus('Merk "' + brand + '" verwijderd', 'success');
                updateCategoryTabs();
            } else {
                showStatus('Kan merk "' + brand + '" niet verwijderen - er zijn nog aassoorten van dit merk', 'error');
            }
        }
    };
    
    tab.title = 'Links-klik: filter op ' + brand + '\nRechts-klik: verwijder merk (indien leeg)';
    return tab;
}

function updateLureGrid(searchQuery) {
    if (fallbackMode || typeof LureManager === 'undefined' || typeof LureManager.getAll !== 'function') {
        updateLureGridFallback(searchQuery);
        return;
    }
    
    try {
        searchQuery = searchQuery || '';
        const grid = document.getElementById('lureGrid');
        if (!grid) return;
        
        grid.innerHTML = '';
        
        let lures = LureManager.getAll();
        
        if (searchQuery) {
            lures = (typeof LureManager.search === 'function') 
                ? LureManager.search(searchQuery)
                : lures.filter(l => l.name.toLowerCase().includes(searchQuery.toLowerCase()));
        } else if (currentLureCategory !== 'all') {
            lures = (typeof LureManager.getByCategory === 'function')
                ? LureManager.getByCategory(currentLureCategory)
                : lures.filter(l => l.category === currentLureCategory);
        }
        
        lures.forEach(function(lure) {
            const item = createLureGridItem(lure);
            grid.appendChild(item);
        });
        
        addNewLureButton(grid);
        
    } catch (error) {
        console.error('Error updating lure grid:', error);
        updateLureGridFallback(searchQuery);
    }
}

function updateLureGridFallback(searchQuery) {
    console.log('Using fallback lure grid update');
    const grid = document.getElementById('lureGrid');
    if (!grid) return;
    
    const statusMessage = fallbackMode 
        ? 'LureManager niet beschikbaar - beperkte functionaliteit'
        : 'LureManager wordt geladen...';
    
    grid.innerHTML = `
        <div class="lure-item lure-add-new disabled">
            <div class="lure-item-image">⏳</div>
            <div class="lure-item-name">${statusMessage}</div>
        </div>
    `;
    
    if (fallbackMode) {
        const retryDiv = document.createElement('div');
        retryDiv.className = 'lure-item lure-retry';
        retryDiv.innerHTML = `
            <div class="lure-item-image">🔄</div>
            <div class="lure-item-name">Opnieuw proberen</div>
        `;
        retryDiv.onclick = function() {
            console.log('Manual retry triggered by user');
            initializationAttempts = 0;
            fallbackMode = false;
            initLureSelector();
        };
        grid.appendChild(retryDiv);
    }
}

function addNewLureButton(grid) {
    const addNew = document.createElement('div');
    addNew.className = 'lure-item lure-add-new';
    addNew.onclick = showAddLureForm;
    addNew.innerHTML = '<div class="lure-item-image">+</div><div class="lure-item-name">Nieuw aas</div>';
    grid.appendChild(addNew);
}

function createLureGridItem(lure) {
    const item = document.createElement('div');
    item.className = 'lure-item';
    
    const imageDiv = document.createElement('div');
    imageDiv.className = 'lure-item-image';
    imageDiv.style.cursor = 'pointer';
    imageDiv.onclick = function() { selectLure(lure.name); };
    
    if (lure.image) {
        const img = document.createElement('img');
        img.src = lure.image;
        img.onerror = function() {
            imageDiv.innerHTML = lure.emoji || '🎣';
        };
        imageDiv.appendChild(img);
    } else {
        imageDiv.innerHTML = lure.emoji || '🎣';
    }
    
    const nameDiv = document.createElement('div');
    nameDiv.className = 'lure-item-name';
    nameDiv.textContent = lure.name;
    nameDiv.title = lure.name;
    nameDiv.style.cursor = 'pointer';
    nameDiv.onclick = function() { selectLure(lure.name); };
    
    const editBtn = document.createElement('button');
    editBtn.className = 'lure-edit-btn';
    editBtn.innerHTML = '✏️';
    editBtn.title = 'Bewerk aas';
    editBtn.type = 'button';
    editBtn.onclick = function(e) {
        e.stopPropagation();
        e.preventDefault();
        editLure(lure);
        return false;
    };
    
    item.appendChild(editBtn);
    item.appendChild(imageDiv);
    item.appendChild(nameDiv);
    
    return item;
}

function displayCriticalError() {
    const grid = document.getElementById('lureGrid');
    if (grid) {
        grid.innerHTML = `
            <div class="lure-item error">
                <div class="lure-item-image">❌</div>
                <div class="lure-item-name">Kritieke fout - herlaad pagina</div>
            </div>
        `;
    }
}

// ================================
// SAFE DROPDOWN POPULATION - FIXED TIMING AND NULL CHECKS
// ================================

function safeRefreshExtendedDropdowns() {
    const dropdownFields = [
        { id: 'newLureType', category: 'aastype' },
        { id: 'newLureActie', category: 'aasactie' },
        { id: 'newLureDrijfvermogen', category: 'aasdrijfvermogen' },
        { id: 'newLurePrimaireKleur', category: 'aasprimairekleur' },
        { id: 'newLureRatel', category: 'aasratel' },
        { id: 'newLureVorm', category: 'aasvorm' },
        { id: 'newLureSecundaireKleur', category: 'aassecundairekleur' },
        { id: 'newLureTail', category: 'aastail' }
    ];
    
    dropdownFields.forEach(field => {
        const element = document.getElementById(field.id);
        if (!element) return;
        
        const currentValue = element.value;
        let options = [];
        
        try {
            if (typeof DropdownManager !== 'undefined' && 
                DropdownManager !== null &&
                typeof DropdownManager.getOptions === 'function' &&
                DropdownManager.options !== null) {
                options = DropdownManager.getOptions(field.category) || [];
            }
        } catch (error) {
            console.warn(`Error getting options for ${field.category}:`, error);
        }
        
        element.innerHTML = '<option value="">- Selecteer -</option>';
        
        options.forEach(option => {
            const selected = option === currentValue ? 'selected' : '';
            element.innerHTML += `<option value="${option}" ${selected}>${option}</option>`;
        });
        
        if (options.length === 0) {
            element.innerHTML = '<option value="">- Wordt geladen... -</option>';
        }
    });
}

function populateCategoryDropdown() {
    const select = document.getElementById('newLureCategory');
    if (!select) return;
    
    select.innerHTML = '<option value="">- Selecteer merk -</option>';
    
    if (!fallbackMode && typeof LureManager !== 'undefined' && typeof LureManager.getAllBrands === 'function') {
        try {
            const brands = LureManager.getAllBrands();
            brands.forEach(function(brand) {
                const option = document.createElement('option');
                option.value = brand;
                option.textContent = brand;
                select.appendChild(option);
            });
        } catch (error) {
            console.error('Error populating category dropdown:', error);
        }
    }
}

// Helper function to reset all extended fields
function resetAllExtendedFields() {
    const extendedFields = [
        'newLureType', 'newLureActie', 'newLureDrijfvermogen', 'newLureLengte',
        'newLurePrimaireKleur', 'newLureRatel', 'newLureVorm', 
        'newLureSecundaireKleur', 'newLureTail'
    ];
    
    extendedFields.forEach(fieldId => {
        const field = document.getElementById(fieldId);
        if (field) {
            field.value = '';
        }
    });
}

// ================================
// OPTION B: STEP 2 - NEW TOGGLE-BASED SHOW ADD LURE FORM
// ================================

function showAddLureForm() {
    if (fallbackMode) {
        alert('Aas toevoegen niet beschikbaar - LureManager wordt nog geladen');
        return;
    }
    
    const modal = document.getElementById('lureModal');
    if (!modal) {
        console.error('Modal not found!');
        return;
    }
    
    // Ensure modal is visible
    modal.style.display = 'block';
    
    // Find or create the add form
    let form = document.getElementById('addLureForm');
    if (!form) {
        // Create form if it doesn't exist
        const lureGrid = document.getElementById('lureGrid');
        if (lureGrid && lureGrid.parentNode) {
            lureGrid.parentNode.insertAdjacentHTML('afterend', createAddLureFormHTML());
            form = document.getElementById('addLureForm');
        }
    }
    
    if (!form) {
        console.error('Could not create or find add form!');
        return;
    }
    
    // Show form and hide grid
    form.style.display = 'block';
    form.classList.add('active');
    
    const lureGrid = document.getElementById('lureGrid');
    if (lureGrid) {
        lureGrid.style.display = 'none';
    }
    
    // Change modal title (use more generic selector for existing modal structure)
    const title = modal.querySelector('h2, h3, .modal-header h2, .modal-header h3');
    if (title) {
        title.textContent = 'Nieuw Aas Toevoegen';
    }
    
    // Populate dropdowns and reset fields
    populateCategoryDropdown();
    resetAllExtendedFields();
    
    setTimeout(() => {
        safeRefreshExtendedDropdowns();
        
        // Focus on name input
        const nameInput = document.getElementById('newLureName');
        if (nameInput) {
            nameInput.focus();
        }
        
        // Scroll form into view
        form.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }, 200);
    
    // Update button states
    const saveBtn = form.querySelector('.add-lure-save');
    if (saveBtn) {
        saveBtn.textContent = '✓ Opslaan';
    }
    
    const deleteBtn = document.getElementById('deleteLureBtn');
    if (deleteBtn) {
        deleteBtn.style.display = 'none';
    }
    
    delete form.dataset.editing;
    
    console.log('✅ Add form shown successfully');
}

function addBrandFromForm() {
    const brandName = prompt('Nieuw merk toevoegen:\n\nVoer de naam van het merk in');
    
    if (!brandName || !brandName.trim()) {
        return;
    }
    
    const name = brandName.trim();
    
    if (fallbackMode || typeof LureManager === 'undefined' || typeof LureManager.addBrand !== 'function') {
        alert('LureManager niet beschikbaar - probeer later opnieuw');
        return;
    }
    
    if (LureManager.addBrand(name)) {
        populateCategoryDropdown();
        
        document.getElementById('newLureCategory').value = name;
        
        if (typeof showStatus === 'function') {
            showStatus('Merk "' + name + '" toegevoegd', 'success');
        }
        
        updateCategoryTabs();
    } else {
        alert('Merk "' + name + '" bestaat al of is ongeldig');
    }
}

// ================================
// OPTION B: STEP 6 - UPDATED EDIT LURE (NO MODAL REPLACEMENT)
// ================================

function editLure(lure) {
    if (fallbackMode) {
        alert('Aas bewerken niet beschikbaar - LureManager wordt nog geladen');
        return;
    }
    
    // Show the add form first
    showAddLureForm();
    
    // Wait for form to be ready, then populate
    setTimeout(() => {
        populateEditForm(lure);
    }, 300);
}

function populateEditForm(lure) {
    document.getElementById('newLureName').value = lure.name;
    document.getElementById('newLureCategory').value = lure.category || '';
    document.getElementById('newLureImage').value = lure.image || '';
    
    const extendedFieldMappings = [
        { id: 'newLureType', property: 'type' },
        { id: 'newLureActie', property: 'actie' },
        { id: 'newLureDrijfvermogen', property: 'drijfvermogen' },
        { id: 'newLureLengte', property: 'lengte' },
        { id: 'newLurePrimaireKleur', property: 'primairekleur' },
        { id: 'newLureRatel', property: 'ratel' },
        { id: 'newLureVorm', property: 'vorm' },
        { id: 'newLureSecundaireKleur', property: 'secundairekleur' },
        { id: 'newLureTail', property: 'tail' }
    ];
    
    extendedFieldMappings.forEach(mapping => {
        const element = document.getElementById(mapping.id);
        if (element) {
            element.value = lure[mapping.property] || '';
        }
    });
    
    const form = document.getElementById('addLureForm');
    const formTitle = form.querySelector('h4');
    if (formTitle) {
        formTitle.textContent = 'Aas bewerken';
    }
    
    form.dataset.editing = lure.name;
    
    const saveBtn = form.querySelector('.add-lure-save');
    if (saveBtn) {
        saveBtn.textContent = '💾 Update';
    }
    
    const deleteBtn = document.getElementById('deleteLureBtn');
    if (deleteBtn) {
        deleteBtn.style.display = 'inline-block';
    }
    
    setTimeout(function() {
        form.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }, 100);
}

function deleteLure() {
    const form = document.getElementById('addLureForm');
    if (!form) return;
    
    const lureName = form.dataset.editing;
    
    if (!lureName) return;
    
    if (confirm('Weet je zeker dat je "' + lureName + '" wilt verwijderen?')) {
        if (!fallbackMode && typeof LureManager !== 'undefined' && typeof LureManager.remove === 'function') {
            LureManager.remove(lureName);
            updateLureGrid();
            cancelAddLure();
            if (typeof showStatus === 'function') {
                showStatus('Aas "' + lureName + '" verwijderd', 'success');
            }
        } else {
            alert('LureManager niet beschikbaar - kan aas niet verwijderen');
        }
    }
}

// ================================
// OPTION B: STEP 4 - UPDATED CANCEL ADD LURE FUNCTION
// ================================

function cancelAddLure() {
    const form = document.getElementById('addLureForm');
    if (!form) return;
    
    // Hide form and show grid
    form.style.display = 'none';
    form.classList.remove('active');
    
    const lureGrid = document.getElementById('lureGrid');
    if (lureGrid) {
        lureGrid.style.display = 'grid';
    }
    
    // Reset modal title (use more generic selector for existing modal structure)
    const modal = document.getElementById('lureModal');
    const title = modal?.querySelector('h2, h3, .modal-header h2, .modal-header h3');
    if (title) {
        title.textContent = 'Selecteer Aas';
    }
    
    // Reset form fields
    const nameInput = document.getElementById('newLureName');
    if (nameInput) nameInput.value = '';
    
    const imageInput = document.getElementById('newLureImage');
    if (imageInput) imageInput.value = '';
    
    const lengteInput = document.getElementById('newLureLengte');
    if (lengteInput) lengteInput.value = '';
    
    resetAllExtendedFields();
    populateCategoryDropdown();
    
    delete form.dataset.editing;
    
    const saveBtn = form.querySelector('.add-lure-save');
    if (saveBtn) {
        saveBtn.textContent = '✓ Opslaan';
    }
    
    const deleteBtn = document.getElementById('deleteLureBtn');
    if (deleteBtn) {
        deleteBtn.style.display = 'none';
    }
    
    console.log('✅ Add form cancelled and hidden');
}

// ================================
// SAVE NEW LURE WITH COMPLETE VALIDATION
// ================================

function saveNewLure() {
    const form = document.getElementById('addLureForm');
    if (!form) return;
    
    if (fallbackMode || typeof LureManager === 'undefined') {
        alert('LureManager niet beschikbaar - probeer later opnieuw');
        return;
    }
    
    const isEditing = form.dataset.editing;
    
    const name = (document.getElementById('newLureName')?.value || '').trim();
    const category = document.getElementById('newLureCategory')?.value || 'Eigen';
    const imageUrl = (document.getElementById('newLureImage')?.value || '').trim();
    
    const type = document.getElementById('newLureType')?.value || '';
    const actie = document.getElementById('newLureActie')?.value || '';
    const drijfvermogen = document.getElementById('newLureDrijfvermogen')?.value || '';
    const lengte = document.getElementById('newLureLengte')?.value || '';
    const primairekleur = document.getElementById('newLurePrimaireKleur')?.value || '';
    const ratel = document.getElementById('newLureRatel')?.value || '';
    
    const vorm = document.getElementById('newLureVorm')?.value || '';
    const secundairekleur = document.getElementById('newLureSecundaireKleur')?.value || '';
    const tail = document.getElementById('newLureTail')?.value || '';
    
    // Basic validation
    if (!name) {
        alert('Vul een naam in voor het aas');
        return;
    }
    
    // Extended field validation
    if (!type) {
        alert('Type is verplicht');
        return;
    }
    if (!actie) {
        alert('Actie is verplicht');
        return;
    }
    if (!drijfvermogen) {
        alert('Drijfvermogen is verplicht');
        return;
    }
    if (!lengte || isNaN(parseFloat(lengte)) || parseFloat(lengte) <= 0) {
        alert('Geldige lengte is verplicht');
        return;
    }
    if (!primairekleur) {
        alert('Primaire kleur is verplicht');
        return;
    }
    if (!ratel) {
        alert('Ratel is verplicht');
        return;
    }
    
    try {
        if (isEditing) {
            if (typeof LureManager.lures !== 'undefined') {
                const existingLure = LureManager.lures.find(function(l) { return l.name === isEditing; });
                if (existingLure) {
                    existingLure.name = name;
                    existingLure.category = category;
                    
                    if (imageUrl) {
                        existingLure.image = imageUrl;
                    }
                    
                    existingLure.type = type;
                    existingLure.actie = actie;
                    existingLure.drijfvermogen = drijfvermogen;
                    existingLure.lengte = parseFloat(lengte);
                    existingLure.primairekleur = primairekleur;
                    existingLure.ratel = ratel;
                    existingLure.vorm = vorm;
                    existingLure.secundairekleur = secundairekleur;
                    existingLure.tail = tail;
                    
                    if (typeof LureManager.save === 'function') {
                        LureManager.save();
                    }
                    
                    updateLureGrid();
                    updateCategoryTabs();
                    cancelAddLure();
                    
                    if (typeof showStatus === 'function') {
                        showStatus('Aas "' + name + '" bijgewerkt', 'success');
                    }
                }
            }
        } else {
            const newLure = {
                name: name,
                category: category,
                emoji: '🎣',
                type: type,
                actie: actie,
                drijfvermogen: drijfvermogen,
                lengte: parseFloat(lengte),
                primairekleur: primairekleur,
                ratel: ratel,
                vorm: vorm,
                secundairekleur: secundairekleur,
                tail: tail
            };
            
            if (imageUrl) {
                newLure.image = imageUrl;
            }
            
            if (typeof LureManager.add === 'function' && LureManager.add(newLure)) {
                updateLureGrid();
                updateCategoryTabs();
                cancelAddLure();
                
                if (typeof showStatus === 'function') {
                    showStatus('Aas "' + name + '" toegevoegd', 'success');
                }
                
                if (currentLureInput) {
                    currentLureInput.value = name;
                    const event = new Event('change');
                    currentLureInput.dispatchEvent(event);
                }
            } else {
                alert('Dit aas bestaat al of LureManager is niet beschikbaar!');
            }
        }
    } catch (error) {
        console.error('Error saving lure:', error);
        alert('Fout bij opslaan van aas: ' + error.message);
    }
}

// ================================
// OPTION B: STEP 3 - ADD LURE FORM HTML FUNCTION
// ================================

function createAddLureFormHTML() {
    return `
        <div id="addLureForm" class="add-lure-form" style="background: #f8f9fa; padding: 20px; border-radius: 8px; border: 1px solid #e0e0e0; margin-top: 20px;">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px;">
                <h4 style="margin: 0; color: #1976D2; border-bottom: 2px solid #1976D2; padding-bottom: 8px;">Nieuw aas toevoegen</h4>
                <button type="button" onclick="cancelAddLure()" style="background: #666; color: white; border: none; border-radius: 4px; padding: 5px 10px; cursor: pointer;">✕</button>
            </div>
            
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px; margin-bottom: 20px;">
                <div>
                    <label style="display: block; margin: 0 0 5px 0; font-weight: bold; color: #d32f2f;">Naam *</label>
                    <input type="text" id="newLureName" placeholder="Naam van het aas" style="width: 100%; padding: 8px; border: 1px solid #ddd; border-radius: 4px;">
                </div>
                
                <div>
                    <label style="display: block; margin: 0 0 5px 0; font-weight: bold;">Merk</label>
                    <div style="display: flex; gap: 5px;">
                        <select id="newLureCategory" style="flex: 1; padding: 8px; border: 1px solid #ddd; border-radius: 4px;">
                            <option value="">- Selecteer merk -</option>
                        </select>
                        <button type="button" onclick="addBrandFromForm()" style="padding: 8px 12px; background: #4CAF50; color: white; border: none; border-radius: 4px; cursor: pointer;">+</button>
                    </div>
                </div>
            </div>
            
            <div style="margin-bottom: 20px;">
                <label style="display: block; margin: 0 0 5px 0; font-weight: bold;">Afbeelding URL</label>
                <input type="url" id="newLureImage" placeholder="https://voorbeeld.com/afbeelding.jpg" style="width: 100%; padding: 8px; border: 1px solid #ddd; border-radius: 4px;">
            </div>
            
            <h5 style="margin: 20px 0 15px 0; color: #1976D2; border-bottom: 1px solid #e0e0e0; padding-bottom: 5px;">🎣 Aas Eigenschappen (Fase 1.2)</h5>
            
            <div style="display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 15px; margin-bottom: 20px;">
                <div>
                    <label style="display: block; margin: 0 0 5px 0; font-weight: bold; color: #d32f2f;">Type *</label>
                    <select id="newLureType" style="width: 100%; padding: 8px; border: 1px solid #ddd; border-radius: 4px;">
                        <option value="">- Wordt geladen... -</option>
                    </select>
                </div>
                
                <div>
                    <label style="display: block; margin: 0 0 5px 0; font-weight: bold; color: #d32f2f;">Actie *</label>
                    <select id="newLureActie" style="width: 100%; padding: 8px; border: 1px solid #ddd; border-radius: 4px;">
                        <option value="">- Wordt geladen... -</option>
                    </select>
                </div>
                
                <div>
                    <label style="display: block; margin: 0 0 5px 0; font-weight: bold; color: #d32f2f;">Drijfvermogen *</label>
                    <select id="newLureDrijfvermogen" style="width: 100%; padding: 8px; border: 1px solid #ddd; border-radius: 4px;">
                        <option value="">- Wordt geladen... -</option>
                    </select>
                </div>
            </div>
            
            <div style="display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 15px; margin-bottom: 20px;">
                <div>
                    <label style="display: block; margin: 0 0 5px 0; font-weight: bold; color: #d32f2f;">Lengte (cm) *</label>
                    <input type="number" id="newLureLengte" placeholder="10.5" style="width: 100%; padding: 8px; border: 1px solid #ddd; border-radius: 4px;" step="0.1" min="0">
                </div>
                
                <div>
                    <label style="display: block; margin: 0 0 5px 0; font-weight: bold; color: #d32f2f;">Primaire Kleur *</label>
                    <select id="newLurePrimaireKleur" style="width: 100%; padding: 8px; border: 1px solid #ddd; border-radius: 4px;">
                        <option value="">- Wordt geladen... -</option>
                    </select>
                </div>
                
                <div>
                    <label style="display: block; margin: 0 0 5px 0; font-weight: bold; color: #d32f2f;">Ratel *</label>
                    <select id="newLureRatel" style="width: 100%; padding: 8px; border: 1px solid #ddd; border-radius: 4px;">
                        <option value="">- Wordt geladen... -</option>
                    </select>
                </div>
            </div>
            
            <h6 style="margin: 15px 0 10px 0; color: #666;">Optionele Eigenschappen</h6>
            <div style="display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 15px; margin-bottom: 20px;">
                <div>
                    <label style="display: block; margin: 0 0 5px 0; font-weight: bold;">Vorm</label>
                    <select id="newLureVorm" style="width: 100%; padding: 8px; border: 1px solid #ddd; border-radius: 4px;">
                        <option value="">- Wordt geladen... -</option>
                    </select>
                </div>
                
                <div>
                    <label style="display: block; margin: 0 0 5px 0; font-weight: bold;">Secundaire Kleur</label>
                    <select id="newLureSecundaireKleur" style="width: 100%; padding: 8px; border: 1px solid #ddd; border-radius: 4px;">
                        <option value="">- Wordt geladen... -</option>
                    </select>
                </div>
                
                <div>
                    <label style="display: block; margin: 0 0 5px 0; font-weight: bold;">Tail</label>
                    <select id="newLureTail" style="width: 100%; padding: 8px; border: 1px solid #ddd; border-radius: 4px;">
                        <option value="">- Wordt geladen... -</option>
                    </select>
                </div>
            </div>
            
            <div style="display: flex; gap: 10px; margin-top: 20px; padding-top: 15px; border-top: 1px solid #e0e0e0;">
                <button type="button" class="add-lure-save" onclick="saveNewLure()" style="background: #4CAF50; color: white; padding: 12px 24px; border: none; border-radius: 4px; cursor: pointer; font-weight: bold;">✓ Opslaan</button>
                <button type="button" onclick="cancelAddLure()" style="background: #f44336; color: white; padding: 12px 24px; border: none; border-radius: 4px; cursor: pointer;">Annuleren</button>
                <button type="button" id="deleteLureBtn" onclick="deleteLure()" style="background: #ff9800; color: white; padding: 12px 24px; border: none; border-radius: 4px; cursor: pointer; display: none;">🗑️ Verwijderen</button>
            </div>
            
            <div style="margin-top: 15px; padding: 12px; background: #e3f2fd; border-left: 4px solid #1976D2; border-radius: 4px; font-size: 13px;">
                <strong>💡 Tips:</strong><br>
                • Velden met * zijn verplicht voor Fase 1.2<br>
                • Gebruik duidelijke namen voor je aasjes<br>
                • Alle eigenschappen helpen bij betere data analyse
            </div>
        </div>
    `;
}

// ================================
// DIAGNOSTICS
// ================================

function diagnoseInitializationIssue() {
    console.log('=== LURE SELECTOR DIAGNOSTICS ===');
    console.log('Initialization attempts:', initializationAttempts);
    console.log('Fallback mode:', fallbackMode);
    console.log('LureManager available:', typeof LureManager !== 'undefined');
    
    if (typeof LureManager !== 'undefined') {
        console.log('LureManager type:', typeof LureManager);
        console.log('LureManager methods:', Object.getOwnPropertyNames(LureManager));
    }
    
    console.log('DropdownManager available:', typeof DropdownManager !== 'undefined');
    console.log('Modal element exists:', !!document.getElementById('lureModal'));
    console.log('Grid element exists:', !!document.getElementById('lureGrid'));
    console.log('================================');
}

window.diagnoseInitializationIssue = diagnoseInitializationIssue;

console.log('🎣 OPTION B IMPLEMENTATION: Enhanced Lure Interface loaded - Complete toggle-based approach with all original content preserved!');

/*
================================================================================
OPTION B IMPLEMENTATION COMPLETE: All Manual Changes Applied

STEP 2 ✅ showAddLureForm() - Replaced with toggle-based approach
STEP 3 ✅ createAddLureFormHTML() - Added complete HTML form function  
STEP 4 ✅ cancelAddLure() - Updated with proper show/hide logic
STEP 5 ✅ createManagerModal() - REMOVED completely (eliminated modal replacement)
STEP 6 ✅ editLure() - Updated to use toggle approach, no modal replacement

ALL ORIGINAL CONTENT PRESERVED:
- Complete initialization system with retry logic
- All UI update functions unchanged
- All dropdown population and validation unchanged  
- All save/delete functionality unchanged
- All diagnostic and error handling unchanged

SIZE CHECK: Should be similar to original (removed large HTML function, added similar size HTML function)
ARCHITECTURE: Toggle-based form approach eliminates modal positioning issues
CSS COMPATIBILITY: Uses existing modal structure with proper class preservation
================================================================================
*/