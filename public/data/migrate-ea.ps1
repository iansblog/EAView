# EA Data Migration Script
Write-Host "Starting EA data migration from be.json to asis.json..."

# Set working directory
$workingDir = "c:\Working\nginx\public\data"
Set-Location $workingDir

# Read source data
$beData = Get-Content "be.json" -Raw | ConvertFrom-Json
$metadata = @{
    name = "Knight Frank Enterprise Architecture Catalog"
    description = "Comprehensive Enterprise Architecture catalog including business capabilities, systems, data entities, platforms, and delivery programs"
    version = "1.0.0"
    lastUpdated = (Get-Date).ToString("yyyy-MM-ddTHH:mm:ssZ")
    organisation = @{
        name = "Knight Frank"
        division = "Global IT"
        region = "Global"
    }
    contact = @{
        primaryArchitect = "Enterprise Architecture Team"
        email = "ea@knightfrank.com"
        team = "Enterprise Architecture"
    }
    governance = @{
        reviewCycle = "Quarterly"
        nextReviewDate = (Get-Date).AddMonths(3).ToString("yyyy-MM-dd")
        approvers = @(
            "Enterprise Architecture Board",
            "Technology Leadership Team"
        )
    }
    framework = @{
        name = "Knight Frank EA Framework"
        version = "2025.1"
        customisations = @(
            "Property Management Industry Extensions",
            "Digital Transformation Adaptations"
        )
    }
    tags = @(
        "Property Management",
        "Digital Transformation",
        "Enterprise Systems"
    )
}

# Initialize target structure
$asisData = @{
    metadata = $metadata
    businessCapabilities = @{}
    systems = @{}
    dataEntities = @{}
    platforms = @{}
    deliveryPrograms = @{}
}

# Function to normalize string for IDs
function Get-NormalizedId {
    param([string]$input)
    return $input.ToLower() -replace '[^a-z0-9]', '_'
}

# Function to extract platform info from technology
function Get-PlatformInfo {
    param([string]$technology)
    
    $platformMappings = @{
        '^Azure' = @{
            category = 'ApplicationPlatform'
            vendor = 'Microsoft'
        }
        '^Microsoft' = @{
            category = 'ApplicationPlatform'
            vendor = 'Microsoft'
        }
        'SAP$' = @{
            category = 'IntegrationPlatform'
            vendor = 'SAP'
        }
        'Power BI' = @{
            category = 'DataPlatform'
            vendor = 'Microsoft'
        }
        'Custom.*' = @{
            category = 'ApplicationPlatform'
            vendor = 'Knight Frank'
        }
    }

    foreach ($pattern in $platformMappings.Keys) {
        if ($technology -match $pattern) {
            return $platformMappings[$pattern]
        }
    }

    return @{
        category = 'ApplicationPlatform'
        vendor = ($technology -split ' ')[0]
    }
}

# Process Business Capabilities
function Process-BusinessCapabilities {
    param($capabilities, $parentId = $null)
    
    foreach ($capKey in $capabilities.PSObject.Properties.Name) {
        $cap = $capabilities.$capKey
        $capId = Get-NormalizedId $cap.name
        
        $newCap = @{
            name = $cap.name
            description = $cap.description
            icon = $cap.icon
            color = $cap.color
            systemIds = @()
            childrenIds = @()
        }
        
        if ($parentId) {
            $newCap['parentId'] = $parentId
        }
        
        # Process systems
        if ($cap.systems) {
            foreach ($sys in $cap.systems) {
                if ($sys.name) {
                    $sysId = Get-NormalizedId $sys.name
                    $newCap.systemIds += $sysId
                    Process-System $sys $sysId $capId
                }
            }
        }
        
        # Process children
        if ($cap.children) {
            foreach ($child in $cap.children) {
                $childId = Get-NormalizedId $child.name
                $newCap.childrenIds += $childId
                $asisData.businessCapabilities[$childId] = Process-BusinessCapabilities @{$childId = $child} $capId
            }
        }
        
        $asisData.businessCapabilities[$capId] = $newCap
    }
}

# Process Systems
function Process-System {
    param($system, $sysId, $capabilityId)
    
    if ($asisData.systems.ContainsKey($sysId)) {
        return
    }
    
    $platformInfo = Get-PlatformInfo $system.technology
    $platformId = Get-NormalizedId $system.technology
    
    $newSys = @{
        name = $system.name
        description = $system.description
        technology = $system.technology
        status = $system.status
        criticality = $system.criticality
        owner = $system.owner
        supportLevel = $system.supportLevel
        deploymentType = $system.deploymentType
        costs = @{
            annualCost = $system.annualCost
            fundingCountry = $system.country.ToUpper()
            isCentralised = $true
        }
        usage = @(
            @{
                country = $system.country.ToUpper()
                userCount = 100  # Default value
            }
        )
        contracts = @(
            @{
                startDate = $system.contractStartDate
                endDate = $system.contractEndDate
                value = $system.annualCost
            }
        )
        platformId = $platformId
        dataEntities = @()
    }
    
    # Process integrations as data entities
    if ($system.integrates) {
        foreach ($integration in $system.integrates) {
            $entityId = Get-NormalizedId $integration
            $newSys.dataEntities += $entityId
            Process-DataEntity $integration $entityId $system.dataClassification
        }
    }
    
    $asisData.systems[$sysId] = $newSys
    
    # Process platform
    if (-not $asisData.platforms.ContainsKey($platformId)) {
        $asisData.platforms[$platformId] = @{
            name = $system.technology
            description = "Platform for $($system.technology) based applications"
            category = $platformInfo.category
            vendor = $platformInfo.vendor
            systemIds = @($sysId)
        }
    }
    else {
        $asisData.platforms[$platformId].systemIds += $sysId
    }
}

# Process Data Entities
function Process-DataEntity {
    param($entityName, $entityId, $classification)
    
    if ($asisData.dataEntities.ContainsKey($entityId)) {
        return
    }
    
    $asisData.dataEntities[$entityId] = @{
        name = $entityName
        description = "Data entity for $entityName"
        classification = $classification ?? "Internal"
        groupId = "core_data"
        attributes = @(
            @{
                name = "id"
                type = "string"
                description = "Unique identifier"
            }
        )
        relationships = @()
    }
}

# Start processing
Write-Host "Processing business capabilities..."
Process-BusinessCapabilities $beData.businessCapabilities

# Create delivery programs based on system status
$statusGroups = @{
    "Proposed" = "planning"
    "Development" = "delivery"
    "Production" = "support"
}

foreach ($system in $asisData.systems.Values) {
    $programType = $statusGroups[$system.status]
    if ($programType) {
        $programId = "transformation_2025_$programType"
        if (-not $asisData.deliveryPrograms.ContainsKey($programId)) {
            $asisData.deliveryPrograms[$programId] = @{
                name = "Transformation 2025 - $($system.status)"
                description = "Strategic transformation program for $($system.status.ToLower()) systems"
                status = $system.status
                startDate = "2025-01-01"
                endDate = "2025-12-31"
                budget = "$2000000"
                sponsor = "CTO"
                systemIds = @()
                milestones = @()
            }
        }
        $asisData.deliveryPrograms[$programId].systemIds += $system.name
    }
}

# Convert to JSON and save
Write-Host "Converting to JSON..."
$jsonContent = $asisData | ConvertTo-Json -Depth 10

Write-Host "Saving to asis.json..."
$jsonContent | Set-Content "asis.json" -Encoding UTF8

Write-Host "Migration completed successfully!"
