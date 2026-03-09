// AI-based image verification service
// In production, integrate with TensorFlow.js, Google Vision API, or AWS Rekognition

// Category detection keywords and patterns
const categoryPatterns = {
  dirty_spot: ['garbage', 'trash', 'dirty', 'waste', 'litter', 'mess', 'filth'],
  garbage_dump: ['dump', 'pile', 'heap', 'mountain', 'accumulation'],
  garbage_vehicle: ['truck', 'vehicle', 'van', 'collection'],
  burning_garbage: ['fire', 'smoke', 'burning', 'flames', 'ash'],
  sweeping_not_done: ['leaves', 'dust', 'unswept', 'dirt road'],
  dustbins_not_cleaned: ['bin', 'dustbin', 'container', 'overflowing'],
  open_defecation: ['defecation', 'human waste', 'open area'],
  sewerage_overflow: ['sewage', 'drain', 'overflow', 'sewer', 'manhole'],
  stagnant_water: ['water', 'puddle', 'pool', 'stagnant', 'mosquito'],
  slum_not_clean: ['slum', 'settlement', 'colony', 'area'],
  overgrown_vegetation: ['grass', 'weeds', 'plants', 'vegetation', 'overgrown'],
  stray_animals: ['dog', 'cow', 'animal', 'cattle', 'stray']
};

// Severity levels based on visual analysis
const severityIndicators = {
  high: ['large', 'massive', 'severe', 'dangerous', 'hazardous', 'health risk', 'blocking'],
  medium: ['moderate', 'noticeable', 'spreading', 'growing'],
  low: ['small', 'minor', 'isolated', 'contained']
};

/**
 * Analyze image for complaint verification
 * In production, this would use actual computer vision AI
 */
export const analyzeImage = async (imageData, category, description) => {
  // Simulate AI processing delay
  await new Promise(resolve => setTimeout(resolve, 500));

  // For demo: Use description-based analysis
  // In production: Use TensorFlow.js or cloud AI services
  const descLower = description.toLowerCase();
  
  // Verify category matches description
  const categoryKeywords = categoryPatterns[category] || [];
  const categoryMatch = categoryKeywords.some(keyword => 
    descLower.includes(keyword)
  ) || true; // Default to true for demo

  // Determine severity
  let severity = 'medium';
  if (severityIndicators.high.some(word => descLower.includes(word))) {
    severity = 'high';
  } else if (severityIndicators.low.some(word => descLower.includes(word))) {
    severity = 'low';
  }

  // Generate AI confidence score (simulated)
  const confidence = 0.75 + Math.random() * 0.20; // 75-95%

  // Detected issues (simulated based on category)
  const detectedIssues = generateDetectedIssues(category, description);

  // Priority recommendation
  const priority = calculatePriority(severity, category);

  // Department recommendation
  const department = recommendDepartment(category);

  return {
    isValid: true,
    confidence: Math.round(confidence * 100) / 100,
    categoryMatch,
    severity,
    priority,
    department,
    detectedIssues,
    aiNotes: generateAINotes(category, severity, detectedIssues),
    verifiedAt: new Date().toISOString(),
    requiresUrgentAction: severity === 'high' || priority === 'urgent'
  };
};

/**
 * Generate detected issues based on category
 */
const generateDetectedIssues = (category, description) => {
  const issueMap = {
    dirty_spot: ['Unclean area detected', 'Waste materials visible', 'Sanitation issue identified'],
    garbage_dump: ['Illegal dumping site', 'Accumulated waste', 'Environmental hazard'],
    garbage_vehicle: ['Missed collection', 'Service delay reported'],
    burning_garbage: ['Open burning detected', 'Air pollution risk', 'Fire hazard'],
    sweeping_not_done: ['Unswept roads', 'Dust accumulation', 'Cleanliness issue'],
    dustbins_not_cleaned: ['Overflowing bins', 'Uncollected waste', 'Bin maintenance needed'],
    open_defecation: ['Sanitation violation', 'Health hazard', 'Hygiene concern'],
    sewerage_overflow: ['Drainage blockage', 'Sewage leak', 'Infrastructure issue'],
    stagnant_water: ['Water logging', 'Mosquito breeding risk', 'Drainage problem'],
    slum_not_clean: ['Area cleanliness issue', 'Community sanitation needed'],
    overgrown_vegetation: ['Vegetation overgrowth', 'Road visibility affected', 'Maintenance required'],
    stray_animals: ['Stray animal presence', 'Animal control needed', 'Public safety concern']
  };

  return issueMap[category] || ['Issue detected', 'Requires attention'];
};

/**
 * Calculate priority based on severity and category
 */
const calculatePriority = (severity, category) => {
  const urgentCategories = ['burning_garbage', 'sewerage_overflow', 'open_defecation'];
  const highCategories = ['garbage_dump', 'stagnant_water', 'dustbins_not_cleaned'];

  if (severity === 'high' || urgentCategories.includes(category)) {
    return 'urgent';
  }
  if (severity === 'medium' || highCategories.includes(category)) {
    return 'high';
  }
  return 'medium';
};

/**
 * Recommend department based on category
 */
const recommendDepartment = (category) => {
  const departmentMap = {
    dirty_spot: 'sanitation',
    garbage_dump: 'sanitation',
    garbage_vehicle: 'sanitation',
    burning_garbage: 'environment',
    sweeping_not_done: 'sanitation',
    dustbins_not_cleaned: 'sanitation',
    open_defecation: 'health',
    sewerage_overflow: 'municipal',
    stagnant_water: 'municipal',
    slum_not_clean: 'sanitation',
    overgrown_vegetation: 'municipal',
    stray_animals: 'municipal'
  };

  return departmentMap[category] || 'sanitation';
};

/**
 * Generate AI analysis notes
 */
const generateAINotes = (category, severity, issues) => {
  const templates = {
    high: `URGENT: ${issues[0]}. Immediate action recommended. This appears to be a ${severity} severity ${category.replace(/_/g, ' ')} issue requiring priority attention.`,
    medium: `${issues[0]}. Standard processing recommended. This ${category.replace(/_/g, ' ')} issue has been verified and categorized for department action.`,
    low: `Minor issue detected: ${issues[0]}. Routine handling appropriate. The reported ${category.replace(/_/g, ' ')} has been logged for scheduled maintenance.`
  };

  return templates[severity] || templates.medium;
};

export default { analyzeImage };
