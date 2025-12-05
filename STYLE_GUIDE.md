# CozyLife RPG - Style Guide

This document outlines the visual design principles and style conventions for the CozyLife RPG application.

## Design Philosophy

**Modern, Sleek, and Minimal**

CozyLife RPG follows a modern flat design aesthetic with subtle, light shading. We prioritize clean interfaces with clear visual hierarchy and purposeful use of color.

### Core Principles

- **Flat Design**: Use solid colors with subtle opacity variations instead of gradients
- **Subtle Shading**: Apply light, low-opacity backgrounds (typically 0.04-0.12 alpha)
- **Minimal Visual Noise**: Avoid heavy shadows, borders, and decorative elements
- **Purposeful Color**: Use color to convey meaning (gender, status, states)
- **Clear Hierarchy**: Typography and spacing create visual structure

## Color System

### Gender Color Coding

Gender representation uses distinct, accessible colors with flat shading:

#### Female
- **Primary**: `rgba(233, 30, 99, 0.8)` - Pink/Magenta
- **Background**: `rgba(233, 30, 99, 0.08)` - Very light pink tint
- **Border**: `rgba(233, 30, 99, 0.4)` - Semi-transparent pink

#### Male
- **Primary**: `rgba(33, 150, 243, 0.8)` - Blue
- **Background**: `rgba(33, 150, 243, 0.08)` - Very light blue tint
- **Border**: `rgba(33, 150, 243, 0.4)` - Semi-transparent blue

#### Other/Non-Binary
- **Primary**: `rgba(156, 39, 176, 0.8)` - Purple
- **Background**: `rgba(156, 39, 176, 0.08)` - Very light purple tint
- **Border**: `rgba(156, 39, 176, 0.4)` - Semi-transparent purple

### Relationship Status Colors

#### Positive
- **Background**: `rgba(76, 175, 80, 0.2)` - Green
- **Text**: `#2e7d32` - Dark green

#### Negative
- **Background**: `rgba(244, 67, 54, 0.2)` - Red
- **Text**: `#c62828` - Dark red

#### Neutral
- **Background**: `rgba(158, 158, 158, 0.2)` - Gray
- **Text**: `#616161` - Dark gray

### Neutral Elements

- **Backgrounds**: `rgba(0, 0, 0, 0.04)` - Extremely light gray
- **Borders**: `rgba(0, 0, 0, 0.08)` - Very light gray
- **Disabled**: `rgba(0, 0, 0, 0.3)` - Muted gray
- **Text Secondary**: `rgba(0, 0, 0, 0.6)` - Medium gray
- **Text Primary**: `rgba(0, 0, 0, 0.87)` - Near black

## Component Patterns

### Character Cards

- **Layout**: Flexbox with 2:1 ratio (content:avatar)
- **Avatar Section**: Takes up 1/3 width, flat color background with border-left accent
- **Content Section**: Takes up 2/3 width with internal padding
- **Hover States**: Subtle transform and shadow (no color changes)

### Badges

- **Shape**: Circular (border-radius: 50%)
- **Background**: Flat color at 0.2 alpha
- **Icon Color**: Solid color at 0.8-1.0 alpha
- **Size**: Small (28px) for inline badges

### Cards (Material Design)

- **Elevation**: Use Material Design elevation system
- **Padding**: Consistent 16px internal padding
- **Spacing**: 24px gaps between cards
- **Border-radius**: Follow Material Design defaults (4px-8px)

## Typography

Use Material Design typography scales:

- **Headings**: Medium weight (500)
- **Body**: Regular weight (400)
- **Labels**: Medium weight (500)
- **Caption**: Small size with reduced opacity

## Spacing Scale

Consistent 8px-based spacing:
- **4px**: Micro spacing
- **8px**: Small spacing
- **12px**: Compact spacing
- **16px**: Standard spacing
- **24px**: Section spacing
- **32px**: Large spacing
- **48px**: Extra large spacing

## Interaction States

### Hover
- **Transform**: `translateY(-2px)` or `translateY(-4px)`
- **Shadow**: Subtle increase in elevation
- **Transition**: 0.2s-0.3s ease

### Disabled
- **Opacity**: Reduced opacity (0.5-0.6) or desaturated colors
- **Cursor**: `not-allowed` or default

### Active/Selected
- **Border**: Accent color border
- **Background**: Subtle tint (0.04-0.08 alpha)

## Anti-Patterns

❌ **Avoid These:**

- Gradient backgrounds
- Heavy drop shadows
- Multi-color overlays
- Excessive borders
- Neon or saturated colors
- Decorative animations
- Textured backgrounds
- Skeuomorphic elements

## Accessibility

- Maintain WCAG AA contrast ratios (4.5:1 for text)
- Use color + icon/text for information (not color alone)
- Provide clear focus indicators
- Ensure interactive elements are min 44x44px

## Implementation Notes

### CSS Structure
- Use semantic class names (`.gender-female`, `.status-positive`)
- Group related styles with comments
- Use CSS custom properties for repeated values when appropriate
- Leverage Material Design components where possible

### Consistency
- Apply the same color at the same opacity across components
- Use consistent spacing from the spacing scale
- Maintain flat design principles across new features
