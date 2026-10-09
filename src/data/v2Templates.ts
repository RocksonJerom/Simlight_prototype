import type { V2Simulation } from '../types/v2.js'

export const V2_SUPPLY_CHAIN_SIMULATION: V2Simulation = {
  id: 'v2-supply-chain-crisis',
  title: 'Supply Chain Disruption Management',
  industry: 'Manufacturing',
  difficulty: 'Intermediate',
  duration: '30 minutes',
  companyName: 'ABC Manufacturing Ltd.',
  companyOverview:
    'A mid-sized industrial equipment manufacturer producing high-precision pump assemblies. Operating at tight delivery schedules with key original equipment manufacturers (OEMs).',
  initialRole: 'Supply Chain Director',
  learningObjectives: [
    'Inventory policy & safety stock trade-offs',
    'Supplier contract renegotiation & relationship management',
    'Logistics risk mitigation & emergency freight management',
    'Cost optimization vs delivery reliability balancing',
  ],
  version: '2.0',
  variables: [
    {
      id: 'cash',
      label: 'Cash Reserve',
      description: 'Available liquid capital for operations',
      unit: 'currency_inr',
      category: 'financial',
      initialValue: 5000000,
      currentValue: 5000000,
      min: 0,
      max: 10000000,
      targetDirection: 'higher_is_better',
    },
    {
      id: 'inventory',
      label: 'Finished & Parts Inventory',
      description: 'Component units currently in warehouse',
      unit: 'units',
      category: 'operational',
      initialValue: 8000,
      currentValue: 8000,
      min: 500,
      max: 20000,
      targetDirection: 'target_range',
      benchmark: 7500,
    },
    {
      id: 'monthly_demand',
      label: 'Monthly Customer Demand',
      description: 'Committed OEM delivery orders',
      unit: 'units',
      category: 'market',
      initialValue: 7200,
      currentValue: 7200,
      min: 2000,
      max: 15000,
      targetDirection: 'higher_is_better',
    },
    {
      id: 'unit_cost',
      label: 'Unit Procurement Cost',
      description: 'Average raw material cost per component',
      unit: 'currency_inr',
      category: 'financial',
      initialValue: 850,
      currentValue: 850,
      min: 500,
      max: 1500,
      targetDirection: 'lower_is_better',
    },
    {
      id: 'supplier_reliability',
      label: 'Supplier Delivery Reliability',
      description: 'On-time, in-full (OTIF) delivery rate',
      unit: 'percent',
      category: 'operational',
      initialValue: 88,
      currentValue: 88,
      min: 10,
      max: 100,
      targetDirection: 'higher_is_better',
    },
    {
      id: 'customer_satisfaction',
      label: 'OEM Customer Satisfaction',
      description: 'Fulfillment satisfaction index',
      unit: 'percent',
      category: 'reputation',
      initialValue: 82,
      currentValue: 82,
      min: 20,
      max: 100,
      targetDirection: 'higher_is_better',
    },
    {
      id: 'stockout_risk',
      label: 'Stockout Risk Exposure',
      description: 'Probability of halted manufacturing line',
      unit: 'percent',
      category: 'risk',
      initialValue: 18,
      currentValue: 18,
      min: 0,
      max: 100,
      targetDirection: 'lower_is_better',
    },
  ],
  rounds: [
    {
      roundNumber: 1,
      title: 'Phase 1: The 12% Price Shock',
      role: 'Supply Chain Manager',
      company: 'ABC Manufacturing Ltd.',
      situationBrief:
        'Your sole-source alloy casing supplier (Apex Castings) has officially notified you of an immediate 12% price hike due to global bauxite and energy tariffs. With monthly production at risk, you must decide how to handle supplier negotiations, order quantities, and freight speed.',
      bulletPoints: [
        'Apex Castings supplies 85% of critical castings.',
        'Current unit cost is ₹850; proposed cost is ₹952 (+12%).',
        'Safety stock is currently 8,000 units against 7,200 monthly burn.',
      ],
      decisions: [
        {
          id: 'supplier_strategy',
          type: 'select',
          label: 'Supplier Commercial Strategy',
          description: 'Choose how ABC Manufacturing responds to Apex Castings demand',
          options: [
            {
              id: 'accept',
              label: 'Accept 12% Price Increase',
              description: 'Preserves cordial partnership and prompt priority dispatch, but erodes unit gross margin.',
              badge: 'Safe / High Cost',
            },
            {
              id: 'negotiate',
              label: 'Hard Negotiation (Counter with Volume Commitment)',
              description: 'Offer an annual volume commitment in exchange for capping increase at 4%.',
              badge: 'Recommended Trade-Off',
            },
            {
              id: 'switch',
              label: 'Switch to Low-Cost Regional Alternative',
              description: 'Contract Apex competitor at 8% lower price; requires 4-week re-tooling qualification.',
              badge: 'Aggressive / Disruption Risk',
            },
          ],
        },
        {
          id: 'order_quantity',
          type: 'quantity',
          label: 'Procurement Order Quantity',
          description: 'Units of raw alloy castings to purchase this cycle',
          min: 3000,
          max: 12000,
          step: 500,
          defaultValue: 7500,
          unitLabel: 'units',
        },
        {
          id: 'delivery_mode',
          type: 'select',
          label: 'Inbound Logistics Mode',
          options: [
            {
              id: 'normal',
              label: 'Standard Rail & Road Freight',
              description: 'Normal transit time (10-14 days). Standard baseline freight cost.',
            },
            {
              id: 'express',
              label: 'Dedicated Express Cargo Freight',
              description: 'Express transit (3-4 days). Adds ₹45 per unit in expedited transport fees.',
            },
          ],
        },
        {
          id: 'inventory_policy',
          type: 'select',
          label: 'Inventory Buffer Policy',
          options: [
            {
              id: 'conservative',
              label: 'Conservative (Buffer Stock)',
              description: 'Hold 35-day safety inventory to guarantee zero line halts.',
            },
            {
              id: 'balanced',
              label: 'Balanced (JIT + 14-Day Safety)',
              description: 'Balance working capital against modest stockout buffer.',
            },
            {
              id: 'aggressive',
              label: 'Aggressive Lean (Tight JIT)',
              description: 'Minimize inventory carrying costs; highly vulnerable to any logistics hiccup.',
            },
          ],
        },
      ],
      rules: [
        {
          id: 'r1_accept',
          name: 'Accept Price Increase',
          conditions: [{ targetType: 'decision', targetId: 'supplier_strategy', operator: 'equals', value: 'accept' }],
          variableDeltas: [
            { variableId: 'unit_cost', operation: 'percent_change', value: 12 },
            { variableId: 'supplier_reliability', operation: 'add', value: 4 },
            { variableId: 'cash', operation: 'add', value: -420000 },
          ],
          narrativeFeedback:
            'Supplier relationship secured: Apex committed priority allocations. However, unit procurement cost jumped by 12% to ₹952, draining working cash.',
        },
        {
          id: 'r1_negotiate',
          name: 'Negotiation Strategy',
          conditions: [
            { targetType: 'decision', targetId: 'supplier_strategy', operator: 'equals', value: 'negotiate' },
          ],
          variableDeltas: [
            { variableId: 'unit_cost', operation: 'percent_change', value: 4 },
            { variableId: 'supplier_reliability', operation: 'add', value: -6 },
            { variableId: 'cash', operation: 'add', value: -160000 },
          ],
          narrativeFeedback:
            'Negotiation succeeded partially: Apex agreed to limit price hike to +4% in exchange for commitments, but deprioritized emergency order slots.',
        },
        {
          id: 'r1_switch',
          name: 'Switch Supplier',
          conditions: [{ targetType: 'decision', targetId: 'supplier_strategy', operator: 'equals', value: 'switch' }],
          variableDeltas: [
            { variableId: 'unit_cost', operation: 'percent_change', value: -8 },
            { variableId: 'supplier_reliability', operation: 'add', value: -22 },
            { variableId: 'stockout_risk', operation: 'add', value: 25 },
            { variableId: 'customer_satisfaction', operation: 'add', value: -8 },
          ],
          narrativeFeedback:
            'Unit procurement costs dropped by 8%, but the new supplier struggled with QA calibration, dropping reliability to 66% and spiking stockout risk.',
        },
        {
          id: 'r1_order_qty_high',
          name: 'High Order Volume Discount & Cash Outflow',
          conditions: [{ targetType: 'decision', targetId: 'order_quantity', operator: 'greater_than', value: 8500 }],
          variableDeltas: [
            { variableId: 'inventory', operation: 'add', value: 2500 },
            { variableId: 'cash', operation: 'add', value: -650000 },
            { variableId: 'stockout_risk', operation: 'add', value: -12 },
          ],
          narrativeFeedback:
            'Large purchase order filled warehouse bays, dropping stockout risk significantly while locking ₹6.5 Lakh in working capital.',
        },
        {
          id: 'r1_express_freight',
          name: 'Express Freight Protection',
          conditions: [{ targetType: 'decision', targetId: 'delivery_mode', operator: 'equals', value: 'express' }],
          variableDeltas: [
            { variableId: 'cash', operation: 'add', value: -280000 },
            { variableId: 'stockout_risk', operation: 'add', value: -10 },
            { variableId: 'supplier_reliability', operation: 'add', value: 5 },
          ],
          narrativeFeedback:
            'Express transit shielded ABC from initial transit bottlenecks, though incurred ₹2.8 Lakh in expedited shipping premiums.',
        },
      ],
      events: [],
    },
    {
      roundNumber: 2,
      title: 'Phase 2: Critical Disruption & Capacity Deficit',
      role: 'Supply Chain Manager',
      company: 'ABC Manufacturing Ltd.',
      situationBrief:
        'A flash flood in the primary industrial corridor has forced key transport arteries to close for 10 days. At the same time, your main casting provider announces that equipment breakdown has cut their delivery capacity by 30%. OEM customers are demanding on-time fulfillment under penalty clauses.',
      bulletPoints: [
        'Supplier capacity is officially down 30% for the next 45 days.',
        'Major OEM customer (Sterling Heavy Motors) threatened a 15% cancellation if deliveries slip.',
        'You must choose how to allocate limited components and whether to invoke secondary backup sources.',
      ],
      decisions: [
        {
          id: 'contingency_action',
          type: 'select',
          label: 'Crisis Operational Response',
          options: [
            {
              id: 'emergency_spot_market',
              label: 'Procure from Spot Market (+25% premium)',
              description: 'Buy available casting lots immediately at open spot rates to prevent line downtime.',
              badge: 'Guaranteed Stock / High Cash Burn',
            },
            {
              id: 'ration_production',
              label: 'Ration Production across Top 2 OEM Customers',
              description: 'Fulfill high-margin clients at 100%, defer smaller Tier-2 clients by 20 days.',
              badge: 'Client Prioritization',
            },
            {
              id: 'slow_assembly',
              label: 'Throttle Production Speed by 25%',
              description: 'Extend assembly cycle times, consume safety stock slowly, and negotiate grace periods.',
              badge: 'Conserve Cash / Reputational Hit',
            },
          ],
        },
        {
          id: 'target_price_adjustment',
          type: 'slider',
          label: 'Finished Goods Price Pass-Through to OEMs',
          description: 'Portion of cost increase passed on to your end customers (₹0 to ₹120 per finished unit)',
          min: 0,
          max: 120,
          step: 10,
          defaultValue: 30,
          unitLabel: '₹/unit',
        },
        {
          id: 'expedited_overtime_budget',
          type: 'slider',
          label: 'Internal Overtime & Weekend Shift Budget',
          description: 'Authorize factory floor overtime shifts to expedite assembly (₹0 to ₹5 Lakh)',
          min: 0,
          max: 500000,
          step: 50000,
          defaultValue: 150000,
          unitLabel: '₹',
        },
      ],
      rules: [
        {
          id: 'r2_spot_market',
          name: 'Spot Market Procurement',
          conditions: [{ targetType: 'decision', targetId: 'contingency_action', operator: 'equals', value: 'emergency_spot_market' }],
          variableDeltas: [
            { variableId: 'cash', operation: 'add', value: -750000 },
            { variableId: 'stockout_risk', operation: 'add', value: -20 },
            { variableId: 'customer_satisfaction', operation: 'add', value: 8 },
            { variableId: 'inventory', operation: 'add', value: 1200 },
          ],
          narrativeFeedback:
            'Spot market alloy parts arrived within 72 hours. Manufacturing ran without interruption and customer trust climbed to 90%, but cash reserves declined by ₹7.5 Lakh.',
        },
        {
          id: 'r2_rationing',
          name: 'Ration Production',
          conditions: [{ targetType: 'decision', targetId: 'contingency_action', operator: 'equals', value: 'ration_production' }],
          variableDeltas: [
            { variableId: 'customer_satisfaction', operation: 'add', value: -12 },
            { variableId: 'cash', operation: 'add', value: 120000 },
            { variableId: 'stockout_risk', operation: 'add', value: 5 },
          ],
          narrativeFeedback:
            'Sterling Heavy Motors was satisfied, but secondary clients protested delayed shipments, dragging customer satisfaction down by 12%.',
        },
        {
          id: 'r2_price_pass_high',
          name: 'Aggressive Price Pass-Through',
          conditions: [{ targetType: 'decision', targetId: 'target_price_adjustment', operator: 'greater_than', value: 70 }],
          variableDeltas: [
            { variableId: 'cash', operation: 'add', value: 450000 },
            { variableId: 'monthly_demand', operation: 'percent_change', value: -14 },
            { variableId: 'customer_satisfaction', operation: 'add', value: -10 },
          ],
          narrativeFeedback:
            'Passing heavy price increases onto OEMs protected your gross margin, but triggered competitive pushback—monthly demand contracted by 14%.',
        },
        {
          id: 'r2_overtime_high',
          name: 'High Overtime Authorization',
          conditions: [{ targetType: 'decision', targetId: 'expedited_overtime_budget', operator: 'greater_than', value: 250000 }],
          variableDeltas: [
            { variableId: 'customer_satisfaction', operation: 'add', value: 7 },
            { variableId: 'inventory', operation: 'add', value: -800 },
            { variableId: 'cash', operation: 'add', value: -300000 },
          ],
          narrativeFeedback:
            'Weekend shifts expedited backlogged orders, boosting customer on-time delivery despite the supply deficit.',
        },
      ],
      events: [
        {
          id: 'ev_tariff_spike',
          title: '🚨 Unannounced Port Tariff on Ferrous Alloys',
          description: 'Customs authorities have imposed an ad-valorem surcharge on imported raw casting stock.',
          triggerType: 'round',
          triggerRound: 2,
          impactDeltas: [
            { variableId: 'unit_cost', operation: 'add', value: 45 },
            { variableId: 'cash', operation: 'add', value: -180000 },
          ],
          narrative:
            'Port clearing fees increased raw material prices by ₹45/unit and triggered immediate customs payment deductions.',
          severity: 'warning',
        },
      ],
    },
    {
      roundNumber: 3,
      title: 'Phase 3: Dual-Sourcing & Long-Term Contracts',
      role: 'Chief Operating Officer',
      company: 'ABC Manufacturing Ltd.',
      situationBrief:
        'The immediate crisis is stabilizing, but the Board of Directors has mandated a strategic overhaul of the supply chain architecture. You must set long-term dual-sourcing proportions, partner contract durations, and automated buffer tracking.',
      bulletPoints: [
        'Board objective: Prevent single-point failure while stabilizing unit cost.',
        'Opportunity to lock 12-month or 24-month fixed pricing with indexed escalators.',
        'OEM customers are renewing annual supply agreements.',
      ],
      decisions: [
        {
          id: 'dual_source_split',
          type: 'allocate',
          label: 'Supplier Procurement Volume Allocation (%)',
          description: 'Distribute 100% of upcoming annual volume between suppliers',
          totalBudget: 100,
          budgetUnit: '%',
          allocateItems: [
            { id: 'primary_apex', label: 'Apex Castings (Primary incumbent)', defaultVal: 60, min: 20, max: 90 },
            { id: 'regional_backup', label: 'Vanguard Forgings (Local backup)', defaultVal: 30, min: 10, max: 60 },
            { id: 'spot_buffer', label: 'Spot Market Flexibility Pool', defaultVal: 10, min: 0, max: 30 },
          ],
        },
        {
          id: 'contract_duration',
          type: 'select',
          label: 'Primary Supplier Contract Term',
          options: [
            { id: '3_months', label: '3-Month Rolling Agreements (Maximum Flexibility)' },
            { id: '12_months', label: '12-Month Fixed Price Agreement (Balanced)' },
            { id: '24_months', label: '24-Month Partnership with Joint Risk Sharing (Long-term)' },
          ],
        },
        {
          id: 'digital_monitoring',
          type: 'select',
          label: 'Supply Chain Visibility Investment',
          options: [
            { id: 'basic', label: 'Status Quo Manual Spreadsheets (₹0)' },
            { id: 'iot_tracking', label: 'Real-Time IoT Shipment & Inventory Telemetry (₹4.5 Lakh)' },
          ],
        },
      ],
      rules: [
        {
          id: 'r3_dual_source_healthy',
          name: 'Healthy Diversification',
          conditions: [
            { targetType: 'decision', targetId: 'dual_source_split', operator: 'includes', value: 'regional_backup' },
          ],
          variableDeltas: [
            { variableId: 'stockout_risk', operation: 'add', value: -15 },
            { variableId: 'supplier_reliability', operation: 'add', value: 8 },
          ],
          narrativeFeedback:
            'Dual-sourcing eliminated single-point failure. Operational resilience improved and stockout risk fell to single digits.',
        },
        {
          id: 'r3_long_contract',
          name: '24-Month Partnership',
          conditions: [{ targetType: 'decision', targetId: 'contract_duration', operator: 'equals', value: '24_months' }],
          variableDeltas: [
            { variableId: 'unit_cost', operation: 'percent_change', value: -6 },
            { variableId: 'supplier_reliability', operation: 'add', value: 9 },
            { variableId: 'customer_satisfaction', operation: 'add', value: 6 },
          ],
          narrativeFeedback:
            'Apex rewarded the multi-year commitment with an aggregate 6% volume discount and guaranteed priority delivery SLAs.',
        },
        {
          id: 'r3_iot_investment',
          name: 'IoT Telemetry Upgrade',
          conditions: [{ targetType: 'decision', targetId: 'digital_monitoring', operator: 'equals', value: 'iot_tracking' }],
          variableDeltas: [
            { variableId: 'cash', operation: 'add', value: -450000 },
            { variableId: 'supplier_reliability', operation: 'add', value: 7 },
            { variableId: 'stockout_risk', operation: 'add', value: -10 },
          ],
          narrativeFeedback:
            'Live GPS container telemetry reduced logistics blind spots by 80%, allowing preemptive routing around port holdups.',
        },
      ],
      events: [],
    },
  ],
}

export const V2_MARKETING_BUDGET_SIMULATION: V2Simulation = {
  id: 'v2-marketing-budget-allocation',
  title: 'Omnichannel Marketing & Brand Launch',
  industry: 'FMCG / Consumer Goods',
  difficulty: 'Beginner',
  duration: '25 minutes',
  companyName: 'Nourish Botanicals India',
  companyOverview:
    'A high-growth direct-to-consumer and modern retail organic personal care brand launching an active vitamin-C serum product line.',
  initialRole: 'Chief Marketing Officer (CMO)',
  learningObjectives: [
    'Marketing mix modeling & channel attribution',
    'Customer acquisition cost (CAC) vs brand equity',
    'Immediate sales lift vs contribution margin trade-offs',
    'Audience segmentation (Youth vs Broad Demographic)',
  ],
  version: '2.0',
  variables: [
    {
      id: 'marketing_budget',
      label: 'Remaining Campaign Budget',
      unit: 'currency_inr',
      category: 'financial',
      initialValue: 1000000,
      currentValue: 1000000,
      min: 0,
      max: 2000000,
      targetDirection: 'higher_is_better',
    },
    {
      id: 'brand_awareness',
      label: 'Brand Awareness Index',
      unit: 'percent',
      category: 'market',
      initialValue: 14,
      currentValue: 14,
      min: 0,
      max: 100,
      targetDirection: 'higher_is_better',
    },
    {
      id: 'youth_market_share',
      label: 'Gen-Z & Millennial Penetration',
      unit: 'percent',
      category: 'market',
      initialValue: 8,
      currentValue: 8,
      min: 0,
      max: 100,
      targetDirection: 'higher_is_better',
    },
    {
      id: 'immediate_sales_units',
      label: 'Monthly Units Sold',
      unit: 'units',
      category: 'operational',
      initialValue: 3500,
      currentValue: 3500,
      min: 500,
      max: 30000,
      targetDirection: 'higher_is_better',
    },
    {
      id: 'contribution_margin',
      label: 'Contribution Margin',
      unit: 'percent',
      category: 'financial',
      initialValue: 38.5,
      currentValue: 38.5,
      min: 10,
      max: 70,
      targetDirection: 'higher_is_better',
    },
    {
      id: 'cac',
      label: 'Blended CAC',
      unit: 'currency_inr',
      category: 'financial',
      initialValue: 620,
      currentValue: 620,
      min: 200,
      max: 1800,
      targetDirection: 'lower_is_better',
    },
  ],
  rounds: [
    {
      roundNumber: 1,
      title: 'Round 1: The ₹10 Lakh Budget Allocation',
      role: 'CMO',
      company: 'Nourish Botanicals',
      situationBrief:
        'You have ₹10 Lakh available for the Q3 launch of your flagship glow serum. Distribute this capital across four key media channels. Each channel has distinct trade-offs between brand recall, acquisition speed, and margin erosion.',
      bulletPoints: [
        'Total budget: ₹10,00,000.',
        'Social Media: High digital engagement, low immediate offline sales.',
        'Influencer Collaborations: Strong youth conversion, viral reach.',
        'Television Adverts: Mass reach, very high fixed production cost.',
        'Retail Promotion (BOGO / Discounts): High instant volume, sharp margin decline.',
      ],
      decisions: [
        {
          id: 'media_mix',
          type: 'allocate',
          label: 'Channel Budget Allocation (₹)',
          description: 'Distribute ₹10 Lakh across the 4 primary promotional channels',
          totalBudget: 1000000,
          budgetUnit: '₹',
          allocateItems: [
            { id: 'social_media', label: 'Meta & Search Ads', defaultVal: 350000, min: 0, max: 1000000, step: 25000 },
            { id: 'influencers', label: 'Creator & Influencer Gifting', defaultVal: 300000, min: 0, max: 1000000, step: 25000 },
            { id: 'tv_broadcast', label: 'Regional TV Slots', defaultVal: 200000, min: 0, max: 1000000, step: 25000 },
            { id: 'retail_promo', label: 'Retail In-Store Promos & BOGO', defaultVal: 150000, min: 0, max: 1000000, step: 25000 },
          ],
        },
        {
          id: 'pricing_strategy',
          type: 'slider',
          label: 'Introductory Retail Price (MSRP)',
          description: 'Standard benchmark retail price (₹599 - ₹899)',
          min: 599,
          max: 899,
          step: 20,
          defaultValue: 749,
          unitLabel: '₹',
        },
      ],
      rules: [
        {
          id: 'r_influencer_boost',
          name: 'Influencer Traction',
          conditions: [{ targetType: 'decision', targetId: 'media_mix', operator: 'includes', value: 'influencers' }],
          variableDeltas: [
            { variableId: 'youth_market_share', operation: 'add', value: 14 },
            { variableId: 'brand_awareness', operation: 'add', value: 12 },
            { variableId: 'cac', operation: 'add', value: -90 },
          ],
          narrativeFeedback:
            'Creator campaigns drove viral TikTok and Instagram unboxings, accelerating youth penetration from 8% to 22% with lower customer acquisition cost.',
        },
        {
          id: 'r_retail_tradeoff',
          name: 'Retail Promo Trade-off',
          conditions: [{ targetType: 'decision', targetId: 'media_mix', operator: 'includes', value: 'retail_promo' }],
          variableDeltas: [
            { variableId: 'immediate_sales_units', operation: 'add', value: 4200 },
            { variableId: 'contribution_margin', operation: 'add', value: -4.8 },
          ],
          narrativeFeedback:
            'Retail trade discounts ignited instant store sell-through (+4,200 units), but retailer listing fees chipped 4.8% off your contribution margin.',
        },
        {
          id: 'r_high_price',
          name: 'Premium Pricing Posture',
          conditions: [{ targetType: 'decision', targetId: 'pricing_strategy', operator: 'greater_than', value: 800 }],
          variableDeltas: [
            { variableId: 'contribution_margin', operation: 'add', value: 6.2 },
            { variableId: 'immediate_sales_units', operation: 'percent_change', value: -15 },
          ],
          narrativeFeedback:
            'Pricing above ₹800 signaled premium clinical positioning and widened gross margin to 44.7%, but caused price-sensitive drop-off.',
        },
      ],
      events: [],
    },
    {
      roundNumber: 2,
      title: 'Round 2: Competitor Counter-Attack & Viral Review',
      role: 'CMO',
      company: 'Nourish Botanicals',
      situationBrief:
        'A legacy cosmetics multinational has launched a rival serum at ₹499 with celebrity brand ambassadors. Concurrently, a respected dermatological YouTube influencer has given your formula an A+ purity score, driving an unexpected 40% organic traffic surge.',
      bulletPoints: [
        'Mass rival launched at ₹499 with aggressive TV campaigns.',
        'Organic brand search is up 40% due to viral doctor endorsement.',
        'Decision: Defend shelf-space via price match, or double down on clean-beauty differentiation?',
      ],
      decisions: [
        {
          id: 'competitive_response',
          type: 'select',
          label: 'Strategic Response to Rival Entry',
          options: [
            {
              id: 'price_war',
              label: 'Discount to Match at ₹549',
              description: 'Protect sales volume by sacrificing margins.',
            },
            {
              id: 'clinical_proof',
              label: 'Double Down on Clean Clinical Credentials',
              description: 'Publish certified lab efficacy trials; maintain price premium.',
            },
            {
              id: 'subscription_bundle',
              label: 'Launch 90-Day Auto-Replenishment Bundle',
              description: 'Lock in recurring customer lifetime value (LTV) at 15% subscriber discount.',
            },
          ],
        },
        {
          id: 'retention_spend',
          type: 'slider',
          label: 'Re-Engagement & Loyalty Retention Budget',
          description: 'Investment in SMS, WhatsApp concierge, and loyalty reward tiers (₹0 to ₹3 Lakh)',
          min: 0,
          max: 300000,
          step: 25000,
          defaultValue: 100000,
          unitLabel: '₹',
        },
      ],
      rules: [
        {
          id: 'r_clinical_defense',
          name: 'Clinical Evidence Stance',
          conditions: [{ targetType: 'decision', targetId: 'competitive_response', operator: 'equals', value: 'clinical_proof' }],
          variableDeltas: [
            { variableId: 'brand_awareness', operation: 'add', value: 16 },
            { variableId: 'contribution_margin', operation: 'add', value: 2.5 },
            { variableId: 'youth_market_share', operation: 'add', value: 9 },
          ],
          narrativeFeedback:
            'Positioning as authentic dermatological science deflected the cheap competitor. Discerning consumers paid the full premium.',
        },
        {
          id: 'r_price_war_loss',
          name: 'Price War Margin Trap',
          conditions: [{ targetType: 'decision', targetId: 'competitive_response', operator: 'equals', value: 'price_war' }],
          variableDeltas: [
            { variableId: 'immediate_sales_units', operation: 'add', value: 2500 },
            { variableId: 'contribution_margin', operation: 'add', value: -9.5 },
            { variableId: 'cac', operation: 'add', value: 120 },
          ],
          narrativeFeedback:
            'Matching the rival saved volume in the short term, but compressed contribution margin down by 9.5%, creating unsustainable cash burn.',
        },
      ],
      events: [
        {
          id: 'ev_viral_buzz',
          title: '🔥 Viral Dermatologist Video Endorsement',
          description: 'Dr. Sharma Dermatologist YouTube channel highlighted your serum as "Best Clean Vitamin-C of 2026".',
          triggerType: 'round',
          triggerRound: 2,
          impactDeltas: [
            { variableId: 'brand_awareness', operation: 'add', value: 15 },
            { variableId: 'immediate_sales_units', operation: 'add', value: 1800 },
          ],
          narrative: 'Organic virality granted 15% brand awareness lift and immediate direct orders without ad spend.',
          severity: 'success',
        },
      ],
    },
  ],
}

export const ALL_V2_TEMPLATES: V2Simulation[] = [
  V2_SUPPLY_CHAIN_SIMULATION,
  V2_MARKETING_BUDGET_SIMULATION,
]
