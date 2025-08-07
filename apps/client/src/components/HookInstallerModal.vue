<template>
  <Dialog :open="isOpen" @update:open="$emit('close')">
    <DialogContent class="max-w-md bg-[var(--theme-bg-primary)] border-[var(--theme-border-primary)]">
      <DialogHeader>
        <DialogTitle class="text-[var(--theme-text-primary)] flex items-center gap-2">
          <Plus class="w-4 h-4" />
          Add New Project
        </DialogTitle>
        <div class="text-sm text-[var(--theme-text-secondary)]">
          Install Claude Code hooks to monitor a new project
        </div>
      </DialogHeader>

      <form @submit.prevent="handleSubmit" class="space-y-4">
        <!-- Directory Path -->
        <div class="space-y-2">
          <Label for="directory" class="text-sm font-medium text-[var(--theme-text-primary)]">
            Project Directory <span class="text-red-500">*</span>
          </Label>
          <div class="flex gap-2">
            <Input
              id="directory"
              v-model="form.directory"
              placeholder="/Users/username/Projects/MyProject"
              :class="[
                'flex-1',
                formErrors.directory ? 'border-red-500 focus-visible:ring-red-500' : ''
              ]"
              :disabled="isInstalling"
            />
            <Button 
              type="button" 
              variant="outline" 
              size="sm"
              @click="selectDirectory"
              :disabled="isInstalling"
              class="px-3"
            >
              <Folder class="w-4 h-4" />
            </Button>
          </div>
          <div v-if="formErrors.directory" class="text-xs text-red-500">
            {{ formErrors.directory }}
          </div>
          <div v-else class="text-xs text-[var(--theme-text-tertiary)]">
            Enter the full absolute path to your project directory
            <br>
            <strong>macOS:</strong> Right-click folder in Finder → "Copy as Pathname"
            <br>
            <strong>Windows:</strong> Shift+Right-click folder → "Copy as path"
          </div>
        </div>

        <!-- Project Name -->
        <div class="space-y-2">
          <Label for="projectName" class="text-sm font-medium text-[var(--theme-text-primary)]">
            Display Name <span class="text-red-500">*</span>
          </Label>
          <Input
            id="projectName"
            v-model="form.projectName"
            placeholder="My Awesome Project"
            :class="[
              formErrors.projectName ? 'border-red-500 focus-visible:ring-red-500' : ''
            ]"
            :disabled="isInstalling"
          />
          <div v-if="formErrors.projectName" class="text-xs text-red-500">
            {{ formErrors.projectName }}
          </div>
          <!-- Live Slug Preview -->
          <div v-if="form.projectName" class="text-xs text-[var(--theme-text-tertiary)]">
            Generated identifier: <code class="px-1 py-0.5 bg-[var(--theme-bg-tertiary)] rounded text-[var(--theme-text-secondary)]">{{ slugPreview }}</code>
          </div>
        </div>

        <!-- Server URL -->
        <div class="space-y-2">
          <Label for="serverUrl" class="text-sm font-medium text-[var(--theme-text-primary)]">
            Server URL
          </Label>
          <Input
            id="serverUrl"
            v-model="form.serverUrl"
            placeholder="http://localhost:4000"
            :class="[
              formErrors.serverUrl ? 'border-red-500 focus-visible:ring-red-500' : ''
            ]"
            :disabled="isInstalling"
          />
          <div v-if="formErrors.serverUrl" class="text-xs text-red-500">
            {{ formErrors.serverUrl }}
          </div>
        </div>

        <!-- Error Alert -->
        <Alert v-if="installError" variant="destructive" class="text-sm">
          <AlertCircle class="w-4 h-4" />
          <AlertTitle>Installation Failed</AlertTitle>
          <AlertDescription>{{ installError }}</AlertDescription>
        </Alert>

        <!-- Success State -->
        <div v-if="showSuccess" class="p-4 bg-green-50 border border-green-200 rounded-lg">
          <div class="flex items-center gap-2 text-green-800 mb-2">
            <Check class="w-4 h-4" />
            <span class="font-medium">Installation Successful!</span>
          </div>
          <div class="text-sm text-green-700">
            Claude Code hooks have been installed to <code class="bg-green-100 px-1 py-0.5 rounded">{{ form.directory }}</code>
          </div>
          <div class="text-xs text-green-600 mt-2">
            Project: {{ form.projectName }} ({{ slugPreview }})
          </div>
        </div>

        <!-- Actions -->
        <div class="flex justify-end gap-2 pt-4">
          <Button
            type="button"
            variant="outline"
            @click="$emit('close')"
            :disabled="isInstalling"
          >
            Cancel
          </Button>
          <Button
            type="submit"
            :disabled="!isFormValid || isInstalling"
            class="min-w-[80px]"
          >
            <div v-if="isInstalling" class="flex items-center gap-2">
              <div class="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin"></div>
              Installing...
            </div>
            <div v-else-if="showSuccess" class="flex items-center gap-2">
              <Check class="w-4 h-4" />
              Done
            </div>
            <div v-else>
              Install
            </div>
          </Button>
        </div>
      </form>
    </DialogContent>
  </Dialog>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert'
import { Plus, Folder, Check, AlertCircle } from 'lucide-vue-next'
import { useAppNames } from '@/composables/useAppNames'

interface Props {
  isOpen: boolean
}

const props = defineProps<Props>()

const emit = defineEmits<{
  close: []
  success: [projectData: { name: string; directory: string; slug: string }]
}>()

const { generateSlug } = useAppNames()

// Form state
const form = ref({
  directory: '',
  projectName: '',
  serverUrl: 'http://localhost:4000'
})

const isInstalling = ref(false)
const showSuccess = ref(false)
const installError = ref('')

// Form validation
const formErrors = ref({
  directory: '',
  projectName: '',
  serverUrl: ''
})

// Live slug preview
const slugPreview = computed(() => {
  return form.value.projectName ? generateSlug(form.value.projectName) : ''
})

// Form validation logic
const validateForm = () => {
  const errors = {
    directory: '',
    projectName: '',
    serverUrl: ''
  }

  if (!form.value.directory.trim()) {
    errors.directory = 'Project directory is required'
  }

  if (!form.value.projectName.trim()) {
    errors.projectName = 'Display name is required'
  }

  if (!form.value.serverUrl.trim()) {
    errors.serverUrl = 'Server URL is required'
  } else {
    try {
      new URL(form.value.serverUrl)
    } catch {
      errors.serverUrl = 'Please enter a valid URL'
    }
  }

  formErrors.value = errors
  return !Object.values(errors).some(error => error !== '')
}

const isFormValid = computed(() => {
  return form.value.directory.trim() && 
         form.value.projectName.trim() && 
         form.value.serverUrl.trim() &&
         !Object.values(formErrors.value).some(error => error !== '')
})

// File picker functionality
const selectDirectory = async () => {
  try {
    // Check if File System Access API is available (modern browsers)
    if ('showDirectoryPicker' in window) {
      const dirHandle = await (window as any).showDirectoryPicker({
        mode: 'readwrite'
      })
      
      // Try to get the full path if possible
      if (dirHandle && 'resolve' in dirHandle) {
        try {
          // This is experimental and may not work in all browsers
          const rootHandle = await navigator.storage.getDirectory()
          const relativePath = await rootHandle.resolve(dirHandle)
          if (relativePath && relativePath.length > 0) {
            form.value.directory = '/' + relativePath.join('/')
          } else {
            form.value.directory = dirHandle.name || 'Selected directory'
          }
        } catch {
          // Fallback to just the directory name
          form.value.directory = dirHandle.name || 'Selected directory'
        }
      } else {
        form.value.directory = dirHandle.name || 'Selected directory'
      }
      
      // Store the handle for potential future use
      ;(form.value as any)._dirHandle = dirHandle
    } else {
      // Fallback: Create a hidden file input for directory selection
      const input = document.createElement('input')
      input.type = 'file'
      input.webkitdirectory = true
      input.style.display = 'none'
      
      input.onchange = (e) => {
        const files = (e.target as HTMLInputElement).files
        if (files && files.length > 0) {
          // Extract full directory path from the first file
          const firstFile = files[0]
          const fullPath = firstFile.webkitRelativePath
          
          if (fullPath) {
            // Get the directory path by removing the filename
            const pathParts = fullPath.split('/')
            pathParts.pop() // Remove filename
            const directoryPath = pathParts.join('/')
            
            // Try to construct a more complete path
            // This is a heuristic approach since we can't get the full system path
            form.value.directory = directoryPath ? `/${directoryPath}` : '/Selected directory'
          } else {
            form.value.directory = '/Selected directory'
          }
        }
        document.body.removeChild(input)
      }
      
      document.body.appendChild(input)
      input.click()
    }
  } catch (error) {
    console.error('Directory selection failed:', error)
    // Show user-friendly message
    installError.value = 'Directory selection not supported. Please enter the full path manually (e.g., /Users/username/Projects/MyProject).'
  }
}

// Form submission
const handleSubmit = async () => {
  if (!validateForm()) return

  isInstalling.value = true
  installError.value = ''
  showSuccess.value = false

  try {
    const response = await fetch('http://localhost:4000/api/install-hooks', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        targetPath: form.value.directory,
        displayName: form.value.projectName,
        serverUrl: form.value.serverUrl
      })
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ message: 'Installation failed' }))
      throw new Error(errorData.message || `HTTP ${response.status}`)
    }

    const result = await response.json()
    
    // Show success state
    showSuccess.value = true
    
    // Emit success event with project data
    emit('success', {
      name: form.value.projectName,
      directory: form.value.directory,
      slug: slugPreview.value
    })

    // Auto-close after success
    setTimeout(() => {
      resetForm()
      emit('close')
    }, 2000)

  } catch (error) {
    console.error('Installation failed:', error)
    installError.value = error instanceof Error ? error.message : 'Installation failed'
  } finally {
    isInstalling.value = false
  }
}

// Reset form state
const resetForm = () => {
  form.value = {
    directory: '',
    projectName: '',
    serverUrl: 'http://localhost:4000'
  }
  formErrors.value = {
    directory: '',
    projectName: '',
    serverUrl: ''
  }
  installError.value = ''
  showSuccess.value = false
  isInstalling.value = false
}

// Watch for form changes to clear errors
watch(() => form.value.directory, () => {
  if (formErrors.value.directory) formErrors.value.directory = ''
})

watch(() => form.value.projectName, () => {
  if (formErrors.value.projectName) formErrors.value.projectName = ''
})

watch(() => form.value.serverUrl, () => {
  if (formErrors.value.serverUrl) formErrors.value.serverUrl = ''
})

// Reset form when modal closes
watch(() => props.isOpen, (isOpen) => {
  if (!isOpen) {
    // Small delay to allow close animation
    setTimeout(resetForm, 200)
  }
})
</script>