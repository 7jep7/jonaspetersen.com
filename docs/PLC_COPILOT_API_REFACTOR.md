# PLC Copilot API Refactor Documentation

## Overview
The PLC Copilot has been refactored from a simple chat-based API to a comprehensive context-centric approach that maintains project state, processes file uploads, and provides intelligent workflow management.

## Key Changes

### 1. API Client Updates (`app/lib/api-client.ts`)

#### Old Interface
```typescript
interface ChatRequest {
  user_prompt: string;
  model?: string;
  temperature?: number;
  max_completion_tokens?: number;
}

interface ChatResponse {
  model: string;
  content: string;
  usage: {...};
}
```

#### New Interface
```typescript
interface ProjectContext {
  device_constants: Record<string, any>;
  information: string;
}

interface ContextResponse {
  updated_context: ProjectContext;
  chat_message: string;
  gathering_requirements_progress?: number;
  current_stage: 'gathering_requirements' | 'code_generation' | 'refinement_testing';
  is_mcq: boolean;
  is_multiselect: boolean;
  mcq_question?: string;
  mcq_options: string[];
  generated_code?: string;
}
```

#### New API Method
```typescript
async updateContext(
  context: ProjectContext,
  stage: string,
  message?: string,
  mcqResponses?: string[],
  files?: File[]
): Promise<ContextResponse>
```

- **Endpoint Changed**: From `POST /api/v1/ai/chat` to `POST /api/v1/context/update`
- **Content Type**: From JSON to FormData (to support file uploads)
- **Parameters**: Now includes project context, stage, MCQ responses, and actual files

### 2. Context Management

#### Dual Format Support
The UI now maintains both formats:
- **UI Format**: `deviceConstants: DeviceConstant[]` (for hierarchical display)
- **API Format**: `device_constants: Record<string, any>` (for backend processing)

#### Helper Functions
```typescript
const convertDeviceConstantsToApiFormat = (deviceConstants: DeviceConstant[]): Record<string, any>
const convertApiFormatToDeviceConstants = (device_constants: Record<string, any>): DeviceConstant[]
```

### 3. Stage Management

#### Stage Mapping
- UI stages: `'project_kickoff' | 'gather_requirements' | 'code_generation' | 'refinement_testing' | 'completed'`
- API stages: `'gathering_requirements' | 'code_generation' | 'refinement_testing'`

#### Automatic Stage Transitions
The backend can now update the current stage based on progress, which automatically:
- Updates the UI stage state
- Switches to appropriate views (Context for requirements, Structured Text for code generation)
- Logs transitions for debugging

### 4. File Upload Integration

#### Previous Behavior
- Files were read and stored locally
- Only file metadata was attached to chat messages
- File contents were NOT sent to backend

#### New Behavior
- Files are read and stored locally (unchanged)
- File contents are converted to `File` objects and sent via FormData
- Backend receives actual file contents for processing

#### Implementation
```typescript
uploadedFiles.length > 0 ? uploadedFiles.map(f => {
  const blob = new Blob([f.content || ''], { type: f.type });
  const file = new File([blob], f.name, { type: f.type });
  return file;
}) : undefined
```

### 5. Response Processing

#### New Features Handled
1. **Project Context Updates**: Automatically sync API response context with UI state
2. **Progress Tracking**: Display `gathering_requirements_progress` percentage
3. **Generated Code**: Display `generated_code` in Structured Text view
4. **Stage Transitions**: Handle automatic stage progression
5. **Enhanced MCQ**: Process `is_mcq`, `is_multiselect`, and `mcq_options` from API

#### API Response Processing Flow
```typescript
// Update project context
setProjectContext(prev => ({
  ...response.updated_context,
  deviceConstants: convertApiFormatToDeviceConstants(response.updated_context.device_constants)
}));

// Update stage if changed
if (response.current_stage !== currentStage) {
  const mappedStage = stageMapping[response.current_stage];
  handleStageTransition(mappedStage, 'Backend updated stage');
}

// Update progress and code
if (response.gathering_requirements_progress !== undefined) {
  setStageProgress({ confidence: response.gathering_requirements_progress });
}
if (response.generated_code) {
  setGeneratedCode(response.generated_code);
}
```

### 6. API Call Patterns

#### Three Main Call Scenarios

1. **Text Message with Optional Files**
```typescript
await apiClient.updateContext(
  projectContext,
  convertStageToApiFormat(currentStage),
  userMessage.content,
  undefined, // no MCQ responses
  files // actual File objects
);
```

2. **MCQ-Only Response**
```typescript
await apiClient.updateContext(
  projectContext,
  convertStageToApiFormat(currentStage),
  undefined, // no message
  mcqSelections, // array of selected options
  undefined // no files
);
```

3. **Text + MCQ + Files (Combined)**
```typescript
await apiClient.updateContext(
  projectContext,
  convertStageToApiFormat(currentStage),
  visibleContent,
  mcqSelections.length > 0 ? mcqSelections : undefined,
  files
);
```

## Benefits of New Architecture

### 1. **Intelligent Context Management**
- Backend maintains comprehensive project state
- Automatic extraction of device constants from files
- Progressive requirements gathering with confidence scoring

### 2. **File Processing**
- Real file content analysis (datasheets, manuals, specifications)
- Immediate extraction of PLC-relevant data
- Support for multiple file formats

### 3. **Workflow Intelligence**
- Stage-aware AI responses
- Automatic progress calculation
- Smart view switching based on current stage

### 4. **Enhanced User Experience**
- Structured questions via MCQ
- Progress visibility
- Real-time context updates
- Generated code display

### 5. **Simplified Integration**
- Single endpoint for all interactions
- Consistent request/response patterns
- Built-in error handling and fallbacks

## Migration Notes

### Removed Functionality
- Old `chat()` method completely removed
- Manual MCQ parsing from text content (now handled by API)
- Static code templates (replaced with dynamic generation)

### Backward Compatibility
- Existing project context is automatically migrated
- UI state management remains largely unchanged
- Logging and error handling patterns preserved

### New Dependencies
- FormData support for file uploads
- Blob/File object creation for file transmission
- Enhanced state management for context synchronization

## Testing Considerations

1. **File Upload**: Test various file types (PDF, TXT, etc.)
2. **Stage Transitions**: Verify automatic stage progression
3. **Context Persistence**: Ensure context survives page reloads
4. **MCQ Handling**: Test both single and multi-select scenarios
5. **Error Recovery**: Test network failures and API errors
6. **Progress Display**: Verify requirements gathering progress updates

## Future Enhancements

1. **Timeout Handling**: Add AbortSignal timeouts to prevent hanging requests
2. **Retry Logic**: Implement automatic retry for transient failures
3. **Cache Management**: Consider caching strategies for large project contexts
4. **Real-time Updates**: Potential WebSocket integration for live progress updates
5. **Offline Support**: Consider offline-first capabilities with sync

This refactor positions the PLC Copilot for more sophisticated industrial automation workflows while maintaining a clean, intuitive user experience.