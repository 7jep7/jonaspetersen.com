import { describe, it, expect } from 'vitest'

// We need to extract the helper functions from the session route to test them
// Let's create a separate utils file for these functions
interface DeviceConstant {
  id: string;
  path: string[];
  name: string;
  value: string;
  source?: string;
}

// Copy the helper functions from the session route for testing
const convertDeviceConstantsToApiFormat = (deviceConstants: DeviceConstant[]): Record<string, any> => {
  const result: Record<string, any> = {};
  deviceConstants.forEach(constant => {
    const fullPath = [...constant.path, constant.name];
    let current = result;
    
    // Navigate to the right location in the nested object
    for (let i = 0; i < fullPath.length - 1; i++) {
      const key = fullPath[i];
      if (!current[key]) current[key] = {};
      current = current[key];
    }
    
    // Set the final value
    current[fullPath[fullPath.length - 1]] = constant.value;
  });
  return result;
};

const convertApiFormatToDeviceConstants = (device_constants: Record<string, any>): DeviceConstant[] => {
  const result: DeviceConstant[] = [];
  
  const traverse = (obj: any, currentPath: string[] = []) => {
    Object.entries(obj).forEach(([key, value]) => {
      if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
        traverse(value, [...currentPath, key]);
      } else {
        result.push({
          id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
          path: currentPath,
          name: key,
          value: String(value),
          source: 'api'
        });
      }
    });
  };
  
  traverse(device_constants);
  return result;
};

describe('Context Conversion Helpers', () => {
  describe('convertDeviceConstantsToApiFormat', () => {
    it('should convert flat device constants', () => {
      const deviceConstants: DeviceConstant[] = [
        {
          id: '1',
          path: [],
          name: 'Model',
          value: 'VS-C1500CX',
          source: 'datasheet'
        },
        {
          id: '2',
          path: [],
          name: 'Vendor',
          value: 'KEYENCE',
          source: 'datasheet'
        }
      ];

      const result = convertDeviceConstantsToApiFormat(deviceConstants);

      expect(result).toEqual({
        Model: 'VS-C1500CX',
        Vendor: 'KEYENCE'
      });
    });

    it('should convert hierarchical device constants', () => {
      const deviceConstants: DeviceConstant[] = [
        {
          id: '1',
          path: ['Device'],
          name: 'Model',
          value: 'VS-C1500CX',
          source: 'datasheet'
        },
        {
          id: '2',
          path: ['Device'],
          name: 'Vendor',
          value: 'KEYENCE',
          source: 'datasheet'
        },
        {
          id: '3',
          path: ['Interface'],
          name: 'Type',
          value: 'Ethernet/IP',
          source: 'conversation'
        }
      ];

      const result = convertDeviceConstantsToApiFormat(deviceConstants);

      expect(result).toEqual({
        Device: {
          Model: 'VS-C1500CX',
          Vendor: 'KEYENCE'
        },
        Interface: {
          Type: 'Ethernet/IP'
        }
      });
    });

    it('should handle deeply nested paths', () => {
      const deviceConstants: DeviceConstant[] = [
        {
          id: '1',
          path: ['Device', 'Camera', 'Specifications'],
          name: 'Resolution',
          value: '1920x1080',
          source: 'datasheet'
        }
      ];

      const result = convertDeviceConstantsToApiFormat(deviceConstants);

      expect(result).toEqual({
        Device: {
          Camera: {
            Specifications: {
              Resolution: '1920x1080'
            }
          }
        }
      });
    });

    it('should handle empty array', () => {
      const result = convertDeviceConstantsToApiFormat([]);
      expect(result).toEqual({});
    });
  });

  describe('convertApiFormatToDeviceConstants', () => {
    it('should convert flat API format', () => {
      const apiFormat = {
        Model: 'VS-C1500CX',
        Vendor: 'KEYENCE'
      };

      const result = convertApiFormatToDeviceConstants(apiFormat);

      expect(result).toHaveLength(2);
      expect(result[0]).toMatchObject({
        path: [],
        name: 'Model',
        value: 'VS-C1500CX',
        source: 'api'
      });
      expect(result[1]).toMatchObject({
        path: [],
        name: 'Vendor',
        value: 'KEYENCE',
        source: 'api'
      });
    });

    it('should convert hierarchical API format', () => {
      const apiFormat = {
        Device: {
          Model: 'VS-C1500CX',
          Vendor: 'KEYENCE'
        },
        Interface: {
          Type: 'Ethernet/IP'
        }
      };

      const result = convertApiFormatToDeviceConstants(apiFormat);

      expect(result).toHaveLength(3);
      
      const modelConstant = result.find(c => c.name === 'Model');
      expect(modelConstant).toMatchObject({
        path: ['Device'],
        name: 'Model',
        value: 'VS-C1500CX',
        source: 'api'
      });

      const typeConstant = result.find(c => c.name === 'Type');
      expect(typeConstant).toMatchObject({
        path: ['Interface'],
        name: 'Type',
        value: 'Ethernet/IP',
        source: 'api'
      });
    });

    it('should handle deeply nested API format', () => {
      const apiFormat = {
        Device: {
          Camera: {
            Specifications: {
              Resolution: '1920x1080',
              FrameRate: '60fps'
            }
          }
        }
      };

      const result = convertApiFormatToDeviceConstants(apiFormat);

      expect(result).toHaveLength(2);
      
      const resolutionConstant = result.find(c => c.name === 'Resolution');
      expect(resolutionConstant).toMatchObject({
        path: ['Device', 'Camera', 'Specifications'],
        name: 'Resolution',
        value: '1920x1080',
        source: 'api'
      });
    });

    it('should handle empty object', () => {
      const result = convertApiFormatToDeviceConstants({});
      expect(result).toEqual([]);
    });

    it('should convert non-string values to strings', () => {
      const apiFormat = {
        Config: {
          Port: 8080,
          Enabled: true,
          Timeout: null
        }
      };

      const result = convertApiFormatToDeviceConstants(apiFormat);

      expect(result).toHaveLength(3);
      expect(result.find(c => c.name === 'Port')?.value).toBe('8080');
      expect(result.find(c => c.name === 'Enabled')?.value).toBe('true');
      expect(result.find(c => c.name === 'Timeout')?.value).toBe('null');
    });
  });

  describe('Round-trip conversion', () => {
    it('should maintain data integrity through round-trip conversion', () => {
      const originalConstants: DeviceConstant[] = [
        {
          id: '1',
          path: ['Device'],
          name: 'Model',
          value: 'VS-C1500CX',
          source: 'datasheet'
        },
        {
          id: '2',
          path: ['Device'],
          name: 'Vendor',
          value: 'KEYENCE',
          source: 'datasheet'
        },
        {
          id: '3',
          path: ['Interface'],
          name: 'Type',
          value: 'Ethernet/IP',
          source: 'conversation'
        }
      ];

      // Convert to API format and back
      const apiFormat = convertDeviceConstantsToApiFormat(originalConstants);
      const convertedBack = convertApiFormatToDeviceConstants(apiFormat);

      // Check that the essential data is preserved (ignoring IDs which are regenerated)
      expect(convertedBack).toHaveLength(3);
      
      const modelConstant = convertedBack.find(c => c.name === 'Model' && c.path.includes('Device'));
      expect(modelConstant).toBeTruthy();
      expect(modelConstant?.value).toBe('VS-C1500CX');

      const vendorConstant = convertedBack.find(c => c.name === 'Vendor' && c.path.includes('Device'));
      expect(vendorConstant).toBeTruthy();
      expect(vendorConstant?.value).toBe('KEYENCE');

      const typeConstant = convertedBack.find(c => c.name === 'Type' && c.path.includes('Interface'));
      expect(typeConstant).toBeTruthy();
      expect(typeConstant?.value).toBe('Ethernet/IP');
    });
  });
});