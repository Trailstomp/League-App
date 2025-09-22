# Production Data Safety Protocol

## CRITICAL: Test Data Contamination Prevention

### What Happened
During backend testing for the deployment data persistence fix, the test file `websitestyle_deployment_test.py` accidentally overwrote production websiteStyle data with placeholder test values like:
- `logoUrl: "data:image/png;base64,backup_logo_data_here"`  
- `backgroundImage: "data:image/jpeg;base64,backup_background_data"`

This caused user customizations (logos, backgrounds, banners) to be lost during deployment.

### Emergency Recovery Procedure
If customizations are lost after deployment:

1. **Open browser console** (F12)
2. **Run emergency recovery**: `window.recoverWebsiteStyle()`
3. **Verify recovery**: Check if customizations are restored
4. **Refresh page**: Ensure data persists after reload

### Prevention Measures Implemented

#### 1. Test File Safety Updates
- Updated test files to use non-destructive test data
- Added safety warnings to prevent production data overwrites
- Implemented test-specific data keys that don't conflict with production

#### 2. Backup System Enhancements
- Multiple localStorage backup layers
- Automatic timestamp tracking
- Emergency recovery function available globally

#### 3. Data Validation
- Enhanced websiteStyle loading with data validation
- Placeholder data detection and rejection
- Fallback to localStorage when API data is invalid

### Signs of Test Data Contamination
Watch for these console errors indicating corrupted image data:
- `Failed to load resource: net::ERR_INVALID_URL at data:image/png;base64,backup_logo_data_here`
- `Failed to load resource: net::ERR_INVALID_URL at data:image/jpeg;base64,backup_background_data`

### Recovery Success Indicators
Look for these console messages:
- `🚨 Recovered websiteStyle from emergency backup`
- `💾 WebsiteStyle saved with deployment backup`
- `✅ Loaded websiteStyle from API`

### Best Practices
1. **Before Testing**: Always backup customizations manually
2. **After Deployment**: Verify customizations are intact
3. **Emergency Recovery**: Use `window.recoverWebsiteStyle()` if data is lost
4. **Test Environment**: Use separate database for testing when possible

### Technical Details
- **Recovery Function**: `window.recoverWebsiteStyle()`
- **Backup Location**: `localStorage['mlbl_websiteStyle_backup']`
- **Primary Storage**: `localStorage['mlbl_websiteStyle']`
- **API Endpoint**: `POST /api/league-data/websiteStyle`

Your customizations are now protected with multiple layers of backup and recovery mechanisms.