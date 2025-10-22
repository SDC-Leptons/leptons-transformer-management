"use client"

import { Sidebar } from "@/components/layout/sidebar"
import { Header } from "@/components/layout/header"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { toast } from "sonner"

export default function SettingsPage() {
  const handleRetrain = () => {
    // Fire and forget - don't wait for response
    fetch('/api/retrain', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
    }).catch((error) => {
      console.error('Retrain request failed:', error)
    })
    
    toast.success('Retraining process initiated')
  }
  return (
    <div className="flex h-screen bg-gray-50">
      <Sidebar />
      <div className="flex-1 flex flex-col">
        <Header title="Settings" />

        <div className="flex-1 p-6">
          <div className="max-w-4xl mx-auto space-y-6">
            {/* General Settings */}
            <Card>
              <CardHeader>
                <CardTitle>General Settings</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="company">Company Name</Label>
                    <Input id="company" defaultValue="Power Utility Company" />
                  </div>
                  <div>
                    <Label htmlFor="department">Department</Label>
                    <Input id="department" defaultValue="Transformer Inspection Division" />
                  </div>
                </div>
                <div>
                  <Label htmlFor="email">Notification Email</Label>
                  <Input id="email" type="email" defaultValue="admin@powerutility.com" />
                </div>
              </CardContent>
            </Card>

            {/* Inspection Settings */}
            <Card>
              <CardHeader>
                <CardTitle>Inspection Settings</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <Label>Auto-generate Inspection Reports</Label>
                    <p className="text-sm text-gray-500">Automatically create reports after thermal analysis</p>
                  </div>
                  <Switch defaultChecked />
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <Label>Email Notifications</Label>
                    <p className="text-sm text-gray-500">Send alerts for anomaly detection</p>
                  </div>
                  <Switch defaultChecked />
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <Label>Automatic Backup</Label>
                    <p className="text-sm text-gray-500">Daily backup of inspection data</p>
                  </div>
                  <Switch defaultChecked />
                </div>
              </CardContent>
            </Card>

            {/* Thermal Image Settings */}
            <Card>
              <CardHeader>
                <CardTitle>Thermal Image Settings</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="maxFileSize">Maximum File Size (MB)</Label>
                  <Input id="maxFileSize" type="number" defaultValue="10" />
                </div>
                <div>
                  <Label htmlFor="imageFormats">Supported Image Formats</Label>
                  <Input id="imageFormats" defaultValue="JPG, PNG, TIFF" readOnly />
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <Label>Compress Images</Label>
                    <p className="text-sm text-gray-500">Reduce file size for storage optimization</p>
                  </div>
                  <Switch defaultChecked />
                </div>
              </CardContent>
            </Card>

            {/* User Management */}
            <Card>
              <CardHeader>
                <CardTitle>User Management</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="defaultRole">Default User Role</Label>
                    <Input id="defaultRole" defaultValue="Inspector" />
                  </div>
                  <div>
                    <Label htmlFor="sessionTimeout">Session Timeout (minutes)</Label>
                    <Input id="sessionTimeout" type="number" defaultValue="60" />
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <Label>Require Two-Factor Authentication</Label>
                    <p className="text-sm text-gray-500">Enhanced security for user accounts</p>
                  </div>
                  <Switch />
                </div>
              </CardContent>
            </Card>

            {/* AI Model Settings */}
            <Card>
              <CardHeader>
                <CardTitle>AI Model Settings</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label>Model Retraining</Label>
                  <p className="text-sm text-gray-500 mb-3">Initiate retraining process for the anomaly detection model</p>
                  <Button 
                    onClick={handleRetrain}
                    className="bg-indigo-600 hover:bg-indigo-700"
                  >
                    Retrain Model
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Save Button */}
            <div className="flex justify-end">
              <Button className="bg-indigo-600 hover:bg-indigo-700">Save Settings</Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
